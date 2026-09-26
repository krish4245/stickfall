extends Node2D

## Hit effect — spawns particles and self-destructs.

@onready var particles: GPUParticles2D = $GPUParticles2D


func _ready() -> void:
	if particles:
		particles.emitting = true
	# Self-destruct after particles finish
	var timer := get_tree().create_timer(1.0)
	timer.timeout.connect(queue_free)
