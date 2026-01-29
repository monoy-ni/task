"""
Flask 主应用
任务拆解工具后端 API
"""
import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from models.schema import (
    TaskBreakdownRequest,
    TaskBreakdownResponse,
    UpdateAnswersRequest,
    RegenerateTasksRequest,
)
from services.ai_service import get_ai_service

load_dotenv()

app = Flask(__name__)

# CORS 配置
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
CORS(app, resources={r"/*": {"origins": cors_origins}})

# 内存存储（生产环境应使用数据库）
projects_storage = {}


@app.route("/", methods=["GET"])
def health_check():
    """健康检查"""
    return jsonify({
        "status": "ok",
        "service": "Task Breakdown API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    })


@app.route("/api/breakdown", methods=["POST"])
def create_task_breakdown():
    """
    创建任务拆解

    POST /api/breakdown
    {
        "form_data": {
            "goal": "string",
            "has_deadline": "yes|no",
            "deadline": "YYYY-MM-DD",
            "experience": "beginner|intermediate|expert",
            "importance": 1-5,
            "daily_hours": "string",
            "working_days": ["周一", "周二", ...],
            "blockers": "string",
            "resources": "string",
            "expectations": ["string", ...]
        }
    }
    """
    print("\n" + "="*50)
    print(f"[{datetime.now().strftime('%H:%M:%S')}] 收到 /api/breakdown 请求")
    print("="*50)
    print(f"请求方法: {request.method}")
    print(f"请求来源: {request.remote_addr}")
    print(f"请求头: {dict(request.headers)}")

    try:
        # 解析请求数据
        data = request.get_json()
        print(f"[DEBUG] 收到请求数据: {data}")  # 调试日志

        if not data or "form_data" not in data:
            return jsonify({"error": "缺少 form_data 参数"}), 400

        form_data = data["form_data"]
        print(f"[DEBUG] 表单数据: {form_data}")  # 调试日志

        # 验证必填字段
        required_fields = ["goal", "daily_hours"]
        for field in required_fields:
            if field not in form_data or not form_data[field]:
                return jsonify({"error": f"缺少必填字段: {field}"}), 400

        # 调用 AI 服务生成任务拆解
        print(f"[DEBUG] 准备调用 AI 服务...")  # 调试
        ai_service = get_ai_service()
        print(f"[DEBUG] AI 服务实例已创建")  # 调试

        # 检查是否配置了 API Key
        import os
        if not os.getenv("SILICONFLOW_API_KEY"):
            print("[WARNING] 未配置 SILICONFLOW_API_KEY，使用模拟数据")
            result = _get_mock_result(form_data)
        else:
            result = ai_service.generate_task_breakdown(form_data)
        print(f"[DEBUG] 任务拆解完成")  # 调试

        # 存储项目数据
        project_id = result["project_id"]
        projects_storage[project_id] = {
            "form_data": form_data,
            "analysis": result.get("analysis", {}),
            "tasks": result["tasks"],
            "follow_up_questions": result["follow_up_questions"],
            "answers": {},
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }

        return jsonify({
            "success": True,
            "data": {
                "project_id": project_id,
                "tasks": result["tasks"],
                "follow_up_questions": result["follow_up_questions"],
                "created_at": datetime.now().isoformat()
            }
        })

    except Exception as e:
        import traceback
        print(f"[ERROR] 详细错误信息:")
        print(f"[ERROR] {str(e)}")
        print(f"[ERROR] Traceback:")
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "message": "任务拆解失败，请稍后重试"
        }), 500


@app.route("/api/projects/<project_id>", methods=["GET"])
def get_project(project_id: str):
    """
    获取项目详情

    GET /api/projects/{project_id}
    """
    project = projects_storage.get(project_id)
    if not project:
        return jsonify({"error": "项目不存在"}), 404

    return jsonify({
        "success": True,
        "data": {
            "project_id": project_id,
            **project
        }
    })


@app.route("/api/projects/<project_id>/answers", methods=["POST", "PUT"])
def update_answers(project_id: str):
    """
    更新补充问题的答案

    POST /api/projects/{project_id}/answers
    {
        "answers": {
            "q1": "answer1",
            "q2": ["option1", "option2"]
        }
    }
    """
    project = projects_storage.get(project_id)
    if not project:
        return jsonify({"error": "项目不存在"}), 404

    try:
        data = request.get_json()
        answers = data.get("answers", {})

        project["answers"] = {**project["answers"], **answers}
        project["updated_at"] = datetime.now().isoformat()

        return jsonify({
            "success": True,
            "message": "答案已更新"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/projects/<project_id>/regenerate", methods=["POST"])
def regenerate_tasks(project_id: str):
    """
    根据补充问题的答案重新生成任务

    POST /api/projects/{project_id}/regenerate
    {
        "answers": {
            "q1": "answer1",
            "q2": ["option1", "option2"]
        }
    }
    """
    project = projects_storage.get(project_id)
    if not project:
        return jsonify({"error": "项目不存在"}), 404

    try:
        data = request.get_json()
        answers = data.get("answers", {})

        # 调用 AI 服务重新生成
        ai_service = get_ai_service()
        result = ai_service.regenerate_with_answers(
            form_data=project["form_data"],
            answers={**project["answers"], **answers},
            previous_tasks=project["tasks"],
            analysis=project.get("analysis", {})
        )

        # 更新项目数据
        project["tasks"] = result["tasks"]
        project["follow_up_questions"] = result.get("follow_up_questions", project["follow_up_questions"])
        project["answers"] = {**project["answers"], **answers}
        project["updated_at"] = datetime.now().isoformat()

        return jsonify({
            "success": True,
            "data": {
                "project_id": project_id,
                "tasks": result["tasks"],
                "follow_up_questions": result.get("follow_up_questions", []),
                "updated_at": datetime.now().isoformat()
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/projects", methods=["GET"])
def list_projects():
    """
    获取所有项目列表

    GET /api/projects
    """
    return jsonify({
        "success": True,
        "data": [
            {
                "project_id": pid,
                "goal": p["form_data"].get("goal"),
                "created_at": p["created_at"]
            }
            for pid, p in projects_storage.items()
        ]
    })


@app.errorhandler(404)
def not_found(error):
    """404 处理"""
    return jsonify({"error": "接口不存在"}), 404


@app.errorhandler(500)
def internal_error(error):
    """500 处理"""
    return jsonify({"error": "服务器内部错误"}), 500


def _get_mock_result(form_data: dict) -> dict:
    """当没有配置 AI API 时返回模拟数据"""
    import uuid

    goal = form_data.get("goal", "学习目标")
    daily_hours = float(form_data.get("daily_hours", 2))

    return {
        "project_id": str(uuid.uuid4()),
        "analysis": {
            "task_type": "技能学习类 - 项目开发",
            "experience_level": "初学者 - 刚开始接触",
            "time_span": "短期(1个月) - 使用周度+日度拆解"
        },
        "tasks": {
            "yearly": [],
            "quarterly": {},
            "monthly": {
                "第1个月 - 基础学习": [
                    {"id": "m1-1", "title": "学习基础知识", "description": f"学习{goal}的基础知识", "estimated_hours": daily_hours * 10}
                ]
            },
            "weekly": {
                "第1周 - 入门": [
                    {"id": "w1-1", "title": "了解基础概念", "description": "了解该领域的基本概念和术语"}
                ],
                "第2周 - 进阶": [
                    {"id": "w2-1", "title": "实践练习", "description": "开始进行简单的实践"}
                ],
                "第3周 - 深入": [
                    {"id": "w3-1", "title": "深入学习", "description": "学习更高级的内容"}
                ],
                "第4周 - 总结": [
                    {"id": "w4-1", "title": "总结复习", "description": "回顾所学内容并总结"}
                ]
            },
            "daily": {
                "第1周": {
                    "周一": [{"id": "d1-1", "title": "环境准备", "description": "准备学习所需的工具和环境", "estimated_hours": daily_hours}],
                    "周二": [{"id": "d1-2", "title": "基础概念学习", "description": "学习最基础的概念", "estimated_hours": daily_hours}],
                    "周三": [{"id": "d1-3", "title": "实践练习1", "description": "完成第一个小练习", "estimated_hours": daily_hours}],
                    "周四": [{"id": "d1-4", "title": "实践练习2", "description": "完成第二个小练习", "estimated_hours": daily_hours}],
                    "周五": [{"id": "d1-5", "title": "周总结", "description": "总结本周所学内容", "estimated_hours": daily_hours}],
                }
            },
            "follow_up_questions": [
                {"id": "q1", "question": "你希望重点学习哪个方面？", "type": "text"},
                {"id": "q2", "question": "你有多少时间可以投入？", "type": "single", "options": ["1小时以下", "1-2小时", "2-4小时", "4小时以上"]}
            ]
        }
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)
