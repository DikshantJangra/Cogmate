from langgraph.graph import StateGraph, END
from app.core.state import CogmateState
from app.core.agents import architect_node, highlighter_node, sim_student_node

def create_cogmate_graph():
    # Initialize the graph with our state schema
    workflow = StateGraph(CogmateState)

    # Add the agent nodes
    workflow.add_node("highlighter", highlighter_node)
    workflow.add_node("architect", architect_node)
    workflow.add_node("sim_student", sim_student_node)

    # Define the execution flow
    # 1. Start with highlighting key concepts from raw transcript
    workflow.set_entry_point("highlighter")
    
    # 2. Pass highlighted concepts to the Architect to build/update the lesson
    workflow.add_edge("highlighter", "architect")
    
    # 3. Architect's work is evaluated by the Simulated Student
    workflow.add_edge("architect", "sim_student")
    
    # 4. Define conditional logic for the feedback loop
    def should_rewrite(state: CogmateState):
        if state.get("eval_score", 1.0) < 0.8:
            return "architect" # Send back for rewrite
        return END

    workflow.add_conditional_edges(
        "sim_student",
        should_rewrite,
        {
            "architect": "architect",
            END: END
        }
    )

    return workflow.compile()

# Global compiled graph instance
cogmate_app = create_cogmate_graph()
