extends Node2D

## Floating combat text / damage number popup.

@onready var label: Label = $Label


func setup(damage_amount: float, is_crit: bool = false) -> void:
	if not is_inside_tree():
		await ready

	label.text = str(int(damage_amount)) if not is_crit else "CRIT " + str(int(damage_amount))
	if is_crit:
		label.add_theme_color_override("font_color", Color(1.0, 0.2, 0.2, 1.0))
		scale = Vector2(1.4, 1.4)
	else:
		label.add_theme_color_override("font_color", Color(1.0, 0.9, 0.2, 1.0))

	# Randomize slight initial offset
	position += Vector2(randf_range(-15, 15), randf_range(-10, 5))

	var tween := create_tween().set_parallel(true)
	# Float upward
	tween.tween_property(self, "position:y", position.y - 45.0, 0.6).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "scale", scale * 1.2, 0.15).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	# Fade out near end
	tween.tween_property(self, "modulate:a", 0.0, 0.3).set_delay(0.35)
	tween.chain().tween_callback(queue_free)
