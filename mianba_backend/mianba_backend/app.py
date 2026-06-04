# ============================================================
# 镜面 - Python 后端服务（使用 Cloudflare Workers AI，完全免费）
# 本地: python app.py
# 云端: gunicorn app:app
# ============================================================

import json
import os
import re

import requests as http_requests
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ============================================================
# Cloudflare Workers AI 配置（完全免费，每天10000次）
# ============================================================

CLOUDFLARE_ACCOUNT_ID = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
CLOUDFLARE_API_TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN")
CLOUDFLARE_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
CLOUDFLARE_API_URL = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/run/{CLOUDFLARE_MODEL}"


def call_llm(messages: list, max_tokens: int = 800) -> str:
    """统一调用 Cloudflare Workers AI"""
    headers = {
        "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
        "Content-Type": "application/json",
    }
    resp = http_requests.post(
        CLOUDFLARE_API_URL,
        headers=headers,
        json={"messages": messages, "max_tokens": max_tokens},
        timeout=60,
    )
    resp.raise_for_status()
    result = resp.json()["result"]["response"]
    # Cloudflare Workers AI 有时返回 dict 而非 string，统一转换
    if isinstance(result, dict):
        result = json.dumps(result, ensure_ascii=False)
    return result


def _interviewer_system_prompt(job_type: str) -> str:
    return (
        f"你是一位{job_type}方向的资深面试官，正在面试一名应届大学生。"
        "根据候选人的回答自然地追问或切换话题，语气专业但不严苛，"
        "每次只问一个问题，问题不超过50字。不要一次问多个问题，不要输出括号舞台说明。"
    )


def _parse_json_from_text(result_text: str):
    result_text = result_text.replace("```json", "").replace("```", "").strip()
    json_match = re.search(r"\{.*\}", result_text, re.DOTALL)
    if json_match:
        return json.loads(json_match.group())
    raise ValueError("AI返回内容中没有找到JSON")


# ============================================================
# 统一 AI 接口：/score-answer
# ============================================================
@app.route("/score-answer", methods=["POST"])
def score_answer():
    data = request.get_json() or {}
    mode = data.get("mode", "score")
    job_type = data.get("job_type", "产品")

    if mode == "interview_chat":
        return _handle_interview_chat(data, job_type)
    if mode == "interview_summary":
        return _handle_interview_summary(data, job_type)
    if mode == "model_answer":
        return _handle_model_answer(data, job_type)

    question = data.get("question", "")
    answer = data.get("answer", "")
    if not question or not answer:
        return jsonify({"error": "问题或回答不能为空"}), 400

    prompt = f"""你是一位资深HR，正在面试一名求职者。

岗位：{job_type}
面试题：{question}
求职者回答：{answer}

请从以下4个维度给出评分（每项0-25分，总分100分）：
1. 内容完整性：回答是否覆盖了题目的核心要点
2. 逻辑结构：表达是否有条理，是否有STAR法则等结构
3. 具体程度：是否有具体案例、数据、细节
4. 岗位匹配度：回答是否体现了对{job_type}岗位的理解

请严格按照以下JSON格式返回，不要输出任何其他内容：
{{
  "total_score": 总分数字,
  "dimensions": {{
    "content": 内容完整性分数,
    "logic": 逻辑结构分数,
    "specific": 具体程度分数,
    "match": 岗位匹配度分数
  }},
  "interviewer_comment": "用面试官第一人称口吻说1-2句对这个回答的总体评价，直接说话，不超过60字",
  "improvements": [
    "改进建议第1条，具体说清楚怎么改",
    "改进建议第2条",
    "改进建议第3条"
  ],
  "highlight": "这个回答最好的一点是什么，一句话"
}}"""

    try:
        messages = [{"role": "user", "content": prompt}]
        result_text = call_llm(messages, max_tokens=800)
        result = _parse_json_from_text(result_text)
        return jsonify(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"AI评分失败: {str(e)}"}), 500


def _handle_interview_chat(data, job_type: str):
    messages = data.get("messages", [])
    if not messages:
        return jsonify({
            "reply": "你好，我是今天的面试官，请先做个自我介绍。",
            "done": False,
        })

    api_messages = [{"role": "system", "content": _interviewer_system_prompt(job_type)}]
    for m in messages:
        role = m.get("role", "user")
        if role not in ("user", "assistant"):
            continue
        api_messages.append({"role": role, "content": m.get("content", "")})

    try:
        reply = call_llm(api_messages, max_tokens=200)
        return jsonify({"reply": reply, "done": False})
    except Exception as e:
        return jsonify({"error": f"对话失败: {str(e)}"}), 500


def _handle_interview_summary(data, job_type: str):
    messages = data.get("messages", [])
    if not messages:
        return jsonify({"error": "没有对话记录"}), 400

    transcript = "\n".join([
        f"{'面试官' if m.get('role') == 'assistant' else '候选人'}：{m.get('content', '')}"
        for m in messages
    ])

    prompt = f"""你是一位{job_type}方向的资深面试官，刚完成一场应届生的真实模拟面试。

完整对话记录：
{transcript}

请根据整场对话给出综合评价，严格按以下JSON格式返回，不要输出其他内容：
{{
  "overall_score": 0-100的综合分,
  "rank": "优秀/良好/一般/需要加强 四选一",
  "summary": "2-4句话总体评价，面试官口吻直接对候选人说",
  "strengths": ["优势1", "优势2"],
  "weaknesses": ["不足1", "不足2"],
  "next_steps": ["改进建议1", "改进建议2", "改进建议3"],
  "hiring_tendency": "倾向录用/有条件录用/暂不录用 三选一",
  "highlight_moment": "表现最好的一个回答片段，一句话",
  "weak_moment": "最需改进的一个回答片段，一句话"
}}"""

    try:
        result_text = call_llm([{"role": "user", "content": prompt}], max_tokens=900)
        result = _parse_json_from_text(result_text)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"综合评价失败: {str(e)}"}), 500


def _handle_model_answer(data, job_type: str):
    question = data.get("question", "")
    keywords = data.get("keywords", [])
    if not question:
        return jsonify({"error": "问题不能为空"}), 400

    kw_text = "、".join(keywords[:6]) if keywords else "岗位核心能力"
    prompt = f"""你是一位资深{job_type}岗位面试官，请针对以下面试题，写一段适合应届生/大学生的优秀示范回答（口述风格，200-350字）。

面试题：{question}
期望覆盖要点：{kw_text}

要求：使用STAR法则或清晰层次，语气自然真诚，有具体细节，不要空洞套话。直接输出回答正文，不要加标题或JSON。"""

    try:
        answer = call_llm([{"role": "user", "content": prompt}], max_tokens=600)
        return jsonify({"answer": answer, "model_answer": answer})
    except Exception as e:
        return jsonify({"error": f"生成失败: {str(e)}"}), 500


# ============================================================
# 综合面试报告
# ============================================================
@app.route("/generate-report", methods=["POST"])
def generate_report():
    data = request.get_json() or {}
    job_type = data.get("job_type", "产品")
    qa_list = data.get("qa_list", [])
    face_summary = data.get("face_summary", {})
    duration_minutes = data.get("duration", 5)

    if not qa_list:
        return jsonify({"error": "没有面试数据"}), 400

    qa_text = "\n".join([
        f"Q{i+1}: {item.get('question', '')}\nA{i+1}: {item.get('answer', '')}\n得分: {item.get('score', 0)}分"
        for i, item in enumerate(qa_list)
    ])
    avg_score = sum(item.get("score", 0) for item in qa_list) / len(qa_list) if qa_list else 0
    face_comment = face_summary.get("comment", "表情自然")

    prompt = f"""你是一位经验丰富的HR，刚刚完成了一场{duration_minutes}分钟的{job_type}岗位面试。

面试问答记录：
{qa_text}

体态表现：{face_comment}，平均回答得分：{avg_score:.0f}分

请写一份面试综合评估报告，严格按照以下JSON格式，不要输出其他内容：
{{
  "overall_score": 综合评分0-100,
  "rank": "优秀/良好/一般/需要加强 四选一",
  "summary": "总体评价，2-3句话，用面试官口吻，直接说给面试者听",
  "strengths": ["优势1", "优势2"],
  "weaknesses": ["不足1", "不足2"],
  "next_steps": ["建议下一步1", "建议下一步2", "建议下一步3"],
  "hiring_tendency": "倾向录用/有条件录用/暂不录用 三选一"
}}"""

    try:
        result_text = call_llm([{"role": "user", "content": prompt}], max_tokens=800)
        result = _parse_json_from_text(result_text)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"报告生成失败: {str(e)}"}), 500


@app.route("/health", methods=["GET"])
def health():
    """健康检查 —— 同时测试 Cloudflare AI 是否可达"""
    # 检查配置是否齐全
    cf_account = bool(CLOUDFLARE_ACCOUNT_ID)
    cf_token = bool(CLOUDFLARE_API_TOKEN)

    status_details = {
        "server": "ok",
        "cloudflare_account_configured": cf_account,
        "cloudflare_token_configured": cf_token,
    }

    # 如果配置齐全，尝试一次轻量调用验证 Token 是否有效
    if cf_account and cf_token:
        try:
            test_url = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-3b-instruct"
            test_resp = http_requests.post(
                test_url,
                headers={
                    "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
                    "Content-Type": "application/json",
                },
                json={"messages": [{"role": "user", "content": "hi"}], "max_tokens": 5},
                timeout=15,
            )
            if test_resp.status_code == 200:
                status_details["cloudflare_api"] = "ok"
                status_details["message"] = "后端运行正常，Cloudflare AI 已连接 ✓"
            elif test_resp.status_code == 401:
                status_details["cloudflare_api"] = "unauthorized"
                status_details["message"] = "后端运行正常，但 Cloudflare API Token 无效或已过期，请重新生成"
            else:
                status_details["cloudflare_api"] = f"error_{test_resp.status_code}"
                status_details["message"] = f"Cloudflare API 返回异常状态码: {test_resp.status_code}"
        except Exception as e:
            status_details["cloudflare_api"] = "unreachable"
            status_details["message"] = f"Cloudflare API 连接失败: {str(e)}"
    else:
        missing = []
        if not cf_account:
            missing.append("CLOUDFLARE_ACCOUNT_ID")
        if not cf_token:
            missing.append("CLOUDFLARE_API_TOKEN")
        status_details["cloudflare_api"] = "not_configured"
        status_details["message"] = f"缺少环境变量: {', '.join(missing)}"

    return jsonify(status_details)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print("=" * 50)
    print("镜面后端启动中（Cloudflare Workers AI）...")
    print(f"访问 http://localhost:{port}/health")
    print("=" * 50)
    app.run(
        debug=True,
        host="0.0.0.0",
        port=port,
    )
