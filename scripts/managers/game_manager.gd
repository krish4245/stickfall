extends Node

## GameManager (Autoload)
## Handles match state, round logic, and scene transitions.

enum GameState { MENU, PLAYING, PAUSED, ROUND_END }

var current_state: GameState = GameState.PLAYING
var players: Array[Player] = []

signal state_changed(new_state: GameState)
signal player_died(player: Player)


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		if current_state == GameState.PLAYING:
			pause_game()
		elif current_state == GameState.PAUSED:
			resume_game()


func register_player(player: Player) -> void:
	if player not in players:
		players.append(player)


func unregister_player(player: Player) -> void:
	players.erase(player)


func start_match() -> void:
	current_state = GameState.PLAYING
	state_changed.emit(current_state)


func on_player_died(player: Player) -> void:
	player_died.emit(player)
	current_state = GameState.ROUND_END
	state_changed.emit(current_state)

	# Restart round after death delay
	var timer := get_tree().create_timer(1.8)
	timer.timeout.connect(restart_round)


func pause_game() -> void:
	if current_state == GameState.PLAYING:
		get_tree().paused = true
		current_state = GameState.PAUSED
		state_changed.emit(current_state)


func resume_game() -> void:
	if current_state == GameState.PAUSED:
		get_tree().paused = false
		current_state = GameState.PLAYING
		state_changed.emit(current_state)


func restart_round() -> void:
	get_tree().paused = false
	current_state = GameState.PLAYING
	state_changed.emit(current_state)
	get_tree().reload_current_scene()
