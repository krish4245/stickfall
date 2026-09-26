extends PlayerState


func enter() -> void:
	player.animation_player.play("idle")
	player.can_double_jump = true


func physics_update(delta: float) -> void:
	apply_movement(delta)

	# Transition: fall off edge
	if not player.is_on_floor():
		state_machine.transition_to("FallState")
		return

	# Transition: start running
	if abs(player.velocity.x) > 10.0:
		state_machine.transition_to("RunState")
		return


func handle_input(event: InputEvent) -> void:
	if event.is_action_pressed("jump") and player.is_on_floor():
		state_machine.transition_to("JumpState")
	if event.is_action_pressed("attack"):
		state_machine.transition_to("AttackState")
