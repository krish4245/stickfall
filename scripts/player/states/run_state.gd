extends PlayerState


func enter() -> void:
	player.animation_player.play("run")


func physics_update(delta: float) -> void:
	apply_movement(delta)

	# Transition: fall off edge
	if not player.is_on_floor():
		state_machine.transition_to("FallState")
		return

	# Transition: stopped moving
	if abs(player.velocity.x) < 10.0:
		state_machine.transition_to("IdleState")
		return


func handle_input(event: InputEvent) -> void:
	if event.is_action_pressed("jump") and player.is_on_floor():
		state_machine.transition_to("JumpState")
	if event.is_action_pressed("attack"):
		state_machine.transition_to("AttackState")
