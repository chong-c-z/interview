import { supabase } from "@/integrations/supabase/client";

/**
 * 保存面试观察记录到数据库
 * @param {Object} observation - 观察记录对象
 * @param {string} observation.userId - 用户ID
 * @param {string} observation.sessionId - 会话ID
 * @param {string} observation.observationType - 观察类型
 * @param {string} observation.observationValue - 观察值
 * @param {string} observation.message - 观察消息
 * @param {string} observation.severity - 严重程度
 */
export const saveInterviewObservation = async (observation) => {
  try {
    const { data, error } = await supabase
      .from('interview_observations')
      .insert([
        {
          user_id: observation.userId,
          session_id: observation.sessionId,
          observation_type: observation.observationType,
          observation_value: observation.observationValue,
          message: observation.message,
          severity: observation.severity,
          timestamp: observation.timestamp || new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('保存观察记录失败:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('保存观察记录时发生错误:', error);
    return null;
  }
};

/**
 * 获取用户的面试观察记录
 * @param {string} userId - 用户ID
 * @param {string} sessionId - 会话ID
 */
export const getInterviewObservations = async (userId, sessionId) => {
  try {
    const { data, error } = await supabase
      .from('interview_observations')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('获取观察记录失败:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.error('获取观察记录时发生错误:', error);
    return [];
  }
};

/**
 * 创建新的面试会话
 * @param {string} userId - 用户ID
 */
export const createInterviewSession = async (userId) => {
  try {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { data, error } = await supabase
      .from('interview_sessions')
      .insert([
        {
          user_id: userId,
          start_time: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('创建面试会话失败:', error);
      return null;
    }

    return {
      id: data[0].id,
      sessionId: sessionId
    };
  } catch (error) {
    console.error('创建面试会话时发生错误:', error);
    return null;
  }
};

/**
 * 结束面试会话并保存评分
 * @param {string} sessionId - 会话ID
 * @param {Object} scores - 评分对象
 */
export const endInterviewSession = async (sessionId, scores) => {
  try {
    const { data, error } = await supabase
      .from('interview_sessions')
      .update({
        end_time: new Date().toISOString(),
        posture_score: scores.postureScore,
        expression_score: scores.expressionScore,
        eye_contact_score: scores.eyeContactScore,
        overall_impression: scores.overallImpression
      })
      .eq('id', sessionId)
      .select();

    if (error) {
      console.error('结束面试会话失败:', error);
      return null;
    }

    return data[0];
  } catch (error) {
    console.error('结束面试会话时发生错误:', error);
    return null;
  }
};

/**
 * 获取用户的面试历史记录
 * @param {string} userId - 用户ID
 */
export const getInterviewHistory = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('获取面试历史失败:', error);
      return [];
    }

    return data;
  } catch (error) {
    console.error('获取面试历史时发生错误:', error);
    return [];
  }
};
