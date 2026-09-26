extends CanvasLayer

## HUD — displays player health, combo counter, controls guide, and FPS.

@onready var health_bar: ProgressBar = $MarginContainer/VBoxContainer/HealthBar
@onready var health_label: Label = $MarginContainer/VBoxContainer/HealthLabel
@onready var combo_label: Label = $MarginContainer/VBoxContainer/ComboLabel
@onready var fps_label: Label = $TopRightContainer/FPSLabel

var player: Player


func _ready() -> void:
	if health_bar:
		health_bar.max_value = 100.0
		health_bar.value = 100.0
	if combo_label:
		combo_label.visible = false

	# Connect to HitManager combo updates
	HitManager.combo_updated.connect(_on_combo_updated)

	# Auto-detect player if not passed
	await get_tree().process_frame
	var p = get_tree().get_first_node_in_group("players")
	if p:
		connect_to_player(p)


func _process(_delta: float) -> void:
	if fps_label:
		fps_label.text = "FPS: %d" % Engine.get_frames_per_second()


func connect_to_player(p: Player) -> void:
	player = p
	if player and player.health_component:
		player.health_component.health_changed.connect(_on_health_changed)
		_on_health_changed(player.health_component.current_health, player.health_component.max_health)


func _on_health_changed(new_health: float, max_health: float) -> void:
	if health_bar:
		health_bar.max_value = max_health
		health_bar.value = new_health
	if health_label:
		health_label.text = "PLAYER HP: %d / %d" % [int(new_health), int(max_health)]


func _on_combo_updated(count: int) -> void:
	if not combo_label:
		return
	if count > 1:
		combo_label.visible = true
		combo_label.text = "🔥 COMBO x%d" % count
		# Pop animation
		var tween := create_tween()
		combo_label.scale = Vector2(1.3, 1.3)
		tween.tween_property(combo_label, "scale", Vector2.ONE, 0.2).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	else:
		combo_label.visible = false
