"""
测试运行器

方便运行各个测试模块
"""
import sys
import os

# 添加父目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def print_menu():
    """打印菜单"""
    print("\n" + "="*50)
    print("AI 服务测试模块")
    print("="*50)
    print("1. 测试 Agent 1: 任务类型分析")
    print("2. 测试 Agent 2: 经验水平评估")
    print("3. 测试 Agent 3: 时间跨度判断")
    print("4. 测试 Agent 4: 补充问题生成")
    print("5. 测试 Agent 5: 任务拆解")
    print("6. 测试完整流程 (所有 Agents)")
    print("0. 退出")
    print("="*50)


def run_test(choice: str):
    """运行指定测试"""
    test_modules = {
        "1": "test_agent1_task_type",
        "2": "test_agent2_experience",
        "3": "test_agent3_time_span",
        "4": "test_agent4_questions",
        "5": "test_agent5_breakdown",
        "6": "test_full_pipeline",
    }

    if choice not in test_modules:
        print("无效选择")
        return

    module_name = test_modules[choice]
    print(f"\n正在加载模块: {module_name}...")

    try:
        # 动态导入模块
        module = __import__(f"test.{module_name}", fromlist=[''])

        # 运行 main 函数
        if hasattr(module, 'main'):
            module.main()
        else:
            print(f"模块 {module_name} 没有 main 函数")

    except Exception as e:
        print(f"\n运行测试时出错: {e}")
        import traceback
        traceback.print_exc()


def main():
    """主函数"""
    if len(sys.argv) > 1:
        # 命令行参数模式
        choice = sys.argv[1]
        run_test(choice)
    else:
        # 交互模式
        while True:
            print_menu()
            choice = input("\n请选择要运行的测试 (0-6): ").strip()

            if choice == "0":
                print("退出")
                break

            run_test(choice)

            input("\n按回车继续...")


if __name__ == "__main__":
    main()
