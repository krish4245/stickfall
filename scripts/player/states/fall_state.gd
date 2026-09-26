extends PlayerState


func enter() -> void:
	player.animation_player.play("fall")


func physics_update(delta: float) -> void:
	apply_movement(delta)

	# Transition: landed
	if player.is_on_floor():
		player.can_double_jump = true
		if abs(player.velocity.x) > 10.0:
			state_machine.transition_to("RunState")
		else:
			state_machine.transition_to("IdleState")
		return


func handle_input(event: InputEvent) -> void:
	# Double jump
	if event.is_action_pressed("jump") and player.can_double_jump:
		player.can_double_jump = false
		state_machine.transition_to("JumpState")
	if event.is_action_pressed("attack"):
		state_machine.transition_to("AttackState")
