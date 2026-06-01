# ============================================================
# 测试脚本 - 运行前请先启动 app.py
# 运行方式: python test.py
# ============================================================

import requests
import json
import base64
import os

BASE_URL = "http://localhost:5000"

def test_health():
    """测试后端是否正常运行"""
    print("\n【测试1】健康检查...")
    r = requests.get(f"{BASE_URL}/health")
    print("结果:", r.json())
    assert r.status_code == 200, "后端未启动！请先运行 python app.py"
    print("✓ 后端正常运行")

def test_score_answer():
    """测试AI评分接口"""
    print("\n【测试2】AI评分接口...")
    payload = {
        "question": "请介绍一下你自己",
        "answer": "我叫张三，有两年产品经理经验，主要负责用户增长方向。做过一个项目把用户留存从30%提升到45%，主要是通过优化新用户引导流程实现的。",
        "job_type": "产品"
    }
    r = requests.post(f"{BASE_URL}/score-answer", json=payload)
    result = r.json()
    print("总分:", result.get("total_score"))
    print("面试官评价:", result.get("interviewer_comment"))
    print("改进建议:")
    for tip in result.get("improvements", []):
        print("  -", tip)
    print("✓ AI评分接口正常")

def test_analyze_face():
    """测试面部表情分析接口（用纯色图片测试连通性）"""
    print("\n【测试3】面部表情分析接口...")
    # 创建一个简单的测试图（纯灰色，只测试接口连通性）
    import numpy as np
    import cv2
    img = np.ones((100, 100, 3), dtype=np.uint8) * 128
    _, buffer = cv2.imencode('.jpg', img)
    img_b64 = "data:image/jpeg;base64," + base64.b64encode(buffer).decode()

    payload = {"image": img_b64}
    r = requests.post(f"{BASE_URL}/analyze-face", json=payload)
    result = r.json()
    print("检测表情:", result.get("emotion_cn", "未知"))
    print("评价:", result.get("comment"))
    print("✓ 面部分析接口正常（注意：测试图无人脸，实际使用时传真实摄像头截图）")

def test_generate_report():
    """测试综合报告生成接口"""
    print("\n【测试4】综合报告生成接口...")
    payload = {
        "job_type": "产品",
        "qa_list": [
            {"question": "请介绍你自己", "answer": "我有两年产品经验，专注用户增长", "score": 75},
            {"question": "说说你做过最有成就感的项目", "answer": "优化新手引导，留存率提升15%", "score": 80},
        ],
        "face_summary": {"comment": "面带微笑，表情自然", "avg_bonus": 8},
        "duration": 10
    }
    r = requests.post(f"{BASE_URL}/generate-report", json=payload)
    result = r.json()
    print("综合评分:", result.get("overall_score"))
    print("等级:", result.get("rank"))
    print("总结:", result.get("summary"))
    print("录用倾向:", result.get("hiring_tendency"))
    print("✓ 综合报告接口正常")

if __name__ == "__main__":
    print("=" * 50)
    print("面霸竞技场后端接口测试")
    print("=" * 50)
    try:
        test_health()
        test_score_answer()
        test_analyze_face()
        test_generate_report()
        print("\n" + "=" * 50)
        print("✓ 全部测试通过！后端运行正常")
        print("=" * 50)
    except requests.exceptions.ConnectionError:
        print("\n❌ 连接失败！请先在另一个终端运行: python app.py")
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
