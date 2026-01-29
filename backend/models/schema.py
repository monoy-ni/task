"""
数据模型定义
"""
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class FormData(BaseModel):
    """前端提交的表单数据"""
    goal: str = Field(..., description="用户目标")
    has_deadline: str = Field(default="no", description="是否有截止日期: yes/no")
    deadline: Optional[str] = Field(default=None, description="截止日期 YYYY-MM-DD")
    experience: str = Field(..., description="经验水平: beginner/intermediate/expert")
    importance: int = Field(default=3, ge=1, le=5, description="重要程度 1-5")
    daily_hours: str = Field(..., description="每日可用小时数")
    working_days: List[str] = Field(default_factory=list, description="工作日列表")
    blockers: str = Field(default="", description="可能的阻碍")
    resources: str = Field(default="", description="已有资源")
    expectations: List[str] = Field(default_factory=list, description="期望收获")


class Task(BaseModel):
    """任务"""
    id: str
    title: str
    description: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    estimated_hours: Optional[float] = None


class TaskHierarchy(BaseModel):
    """任务层级结构"""
    yearly: List[Task] = Field(default_factory=list)
    quarterly: dict[str, List[Task]] = Field(default_factory=dict)
    monthly: dict[str, List[Task]] = Field(default_factory=dict)
    weekly: dict[str, List[Task]] = Field(default_factory=dict)
    daily: dict[str, List[Task]] = Field(default_factory=dict)


class FollowUpQuestion(BaseModel):
    """补充问题"""
    id: str
    question: str
    type: str = Field(..., description="问题类型: text/single/multiple")
    options: Optional[List[str]] = None


class TaskBreakdownResponse(BaseModel):
    """任务拆解响应"""
    tasks: TaskHierarchy
    follow_up_questions: List[FollowUpQuestion]
    project_id: str
    created_at: str


class TaskBreakdownRequest(BaseModel):
    """任务拆解请求"""
    form_data: FormData


class UpdateAnswersRequest(BaseModel):
    """更新补充问题答案请求"""
    project_id: str
    answers: dict[str, str | List[str]]


class RegenerateTasksRequest(BaseModel):
    """重新生成任务请求"""
    project_id: str
    form_data: FormData
    answers: dict[str, str | List[str]] = Field(default_factory=dict)
