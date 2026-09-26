extends Node
class_name PlayerStateMachine

## Manages player state transitions.
## Children of this node should extend PlayerState.

@export var initial_state: NodePath

var current_state: PlayerState
var states: Dictionary = {}

@onready var player: Player = owner as Player


func _ready() -> void:
	if not player:
		player = get_parent() as Player
	if player and not player.is_node_ready():
		await player.ready

	for child in get_children():
		if child is PlayerState:
			states[child.name] = child
			child.state_machine = self
			child.player = player

	if initial_state:
		current_state = get_node(initial_state)
		current_state.enter()


func _process(delta: float) -> void:
	if current_state:
		current_state.update(delta)


func _physics_process(delta: float) -> void:
	if current_state:
		current_state.physics_update(delta)


func _unhandled_input(event: InputEvent) -> void:
	if current_state:
		current_state.handle_input(event)


func transition_to(state_name: String) -> void:
	if not states.has(state_name):
		push_warning("State '%s' not found in state machine." % state_name)
		return

	if current_state:
		current_state.exit()

	current_state = states[state_name]
	current_state.enter()
