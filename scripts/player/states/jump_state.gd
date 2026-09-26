extends PlayerState


func enter() -> void:
	player.velocity.y = -player.jump_force
	player.animation_player.play("jump")
	AudioManager.play_jump()


func physics_update(delta: float) -> void:
	apply_movement(delta)

	# Transition: falling
	if player.velocity.y > 0.0:
		state_machine.transition_to("FallState")
		return


func handle_input(event: InputEvent) -> void:
	# Double jump
	if event.is_action_pressed("jump") and player.can_double_jump:
		player.can_double_jump = false
		player.velocity.y = -player.double_jump_force
		player.animation_player.play("double_jump")
		AudioManager.play_double_jump()
	if event.is_action_pressed("attack"):
		state_machine.transition_to("AttackState")
