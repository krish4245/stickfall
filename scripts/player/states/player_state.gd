extends Node
class_name PlayerState

## Base class for all player states.

var player: Player
var state_machine: PlayerStateMachine


func enter() -> void:
	pass


func exit() -> void:
	pass


func update(_delta: float) -> void:
	pass


func physics_update(_delta: float) -> void:
	pass


func handle_input(_event: InputEvent) -> void:
	pass


## Helper: apply horizontal movement with acceleration / friction.
func apply_movement(delta: float) -> void:
	var input_dir := Input.get_axis("move_left", "move_right")

	if input_dir != 0.0:
		player.velocity.x = move_toward(
			player.velocity.x,
			input_dir * player.speed,
			player.acceleration * delta
		)
	else:
		player.velocity.x = move_toward(
			player.velocity.x,
			0.0,
			player.friction * delta
		)
