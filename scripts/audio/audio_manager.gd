extends Node

## AudioManager (Autoload)
## Procedural SFX synthesizer for Godot 4.
## Generates clean retro/arcade sound effects on the fly with ZERO external assets needed.

var _whoosh_sound: AudioStreamWAV
var _hit_sound: AudioStreamWAV
var _heavy_hit_sound: AudioStreamWAV
var _jump_sound: AudioStreamWAV
var _double_jump_sound: AudioStreamWAV
var _death_sound: AudioStreamWAV

var _players: Array[AudioStreamPlayer] = []
const MAX_PLAYERS = 8


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	# Generate sounds into memory
	_whoosh_sound = _generate_whoosh()
	_hit_sound = _generate_hit()
	_heavy_hit_sound = _generate_heavy_hit()
	_jump_sound = _generate_jump()
	_double_jump_sound = _generate_double_jump()
	_death_sound = _generate_death()

	# Create audio player pool
	for i in MAX_PLAYERS:
		var asp := AudioStreamPlayer.new()
		asp.bus = "Master"
		add_child(asp)
		_players.append(asp)


func _play(stream: AudioStreamWAV, volume_db: float = 0.0, pitch_scale: float = 1.0) -> void:
	for player in _players:
		if not player.playing:
			player.stream = stream
			player.volume_db = volume_db
			player.pitch_scale = pitch_scale + randf_range(-0.08, 0.08)
			player.play()
			return
	# All busy, steal first
	_players[0].stream = stream
	_players[0].volume_db = volume_db
	_players[0].pitch_scale = pitch_scale
	_players[0].play()


func play_whoosh() -> void:
	_play(_whoosh_sound, -4.0, 1.0)


func play_hit() -> void:
	_play(_hit_sound, 0.0, 1.0)


func play_heavy_hit() -> void:
	_play(_heavy_hit_sound, 2.0, 1.0)


func play_jump() -> void:
	_play(_jump_sound, -6.0, 1.0)


func play_double_jump() -> void:
	_play(_double_jump_sound, -4.0, 1.1)


func play_death() -> void:
	_play(_death_sound, 1.0, 0.9)


# ─── SOUND GENERATORS ───────────────────────────────────────────

func _generate_whoosh() -> AudioStreamWAV:
	var sample_rate := 22050
	var duration := 0.18
	var num_samples := int(sample_rate * duration)
	var data := PackedByteArray()
	data.resize(num_samples)

	for i in num_samples:
		var t := float(i) / sample_rate
		var progress := float(i) / num_samples
		# White noise modulated by bandpass sweep and volume envelope
		var envelope := sin(progress * PI)
		var noise := randf_range(-1.0, 1.0)
		var freq := lerpf(400.0, 150.0, progress)
		var tone := sin(t * freq * TAU)
		var val := (noise * 0.5 + tone * 0.5) * envelope
		var byte_val := clampi(int((val * 0.5 + 0.5) * 255.0), 0, 255)
		data[i] = byte_val

	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_8_BITS
	wav.mix_rate = sample_rate
	wav.data = data
	return wav


func _generate_hit() -> AudioStreamWAV:
	var sample_rate := 22050
	var duration := 0.15
	var num_samples := int(sample_rate * duration)
	var data := PackedByteArray()
	data.resize(num_samples)

	for i in num_samples:
		var t := float(i) / sample_rate
		var progress := float(i) / num_samples
		var envelope := exp(-progress * 18.0)
		var noise := randf_range(-1.0, 1.0)
		var thump := sin(t * 120.0 * TAU) * exp(-progress * 12.0)
		var val := (noise * 0.6 + thump * 0.7) * envelope
		var byte_val := clampi(int((val * 0.5 + 0.5) * 255.0), 0, 255)
		data[i] = byte_val

	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_8_BITS
	wav.mix_rate = sample_rate
	wav.data = data
	return wav


func _generate_heavy_hit() -> AudioStreamWAV:
	var sample_rate := 22050
	var duration := 0.28
	var num_samples := int(sample_rate * duration)
	var data := PackedByteArray()
	data.resize(num_samples)

	for i in num_samples:
		var t := float(i) / sample_rate
		var progress := float(i) / num_samples
		var envelope := exp(-progress * 10.0)
		var noise := randf_range(-1.0, 1.0) * exp(-progress * 25.0)
		var bass := sin(t * 80.0 * TAU) * exp(-progress * 6.0)
		var crunch := sin(t * 220.0 * TAU) * 0.4
		var val := (noise * 0.5 + bass * 0.7 + crunch) * envelope
		var byte_val := clampi(int((val * 0.4 + 0.5) * 255.0), 0, 255)
		data[i] = byte_val

	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_8_BITS
	wav.mix_rate = sample_rate
	wav.data = data
	return wav


func _generate_jump() -> AudioStreamWAV:
	var sample_rate := 22050
	var duration := 0.12
	var num_samples := int(sample_rate * duration)
	var data := PackedByteArray()
	data.resize(num_samples)

	var phase := 0.0
	for i in num_samples:
		var progress := float(i) / num_samples
		var envelope := 1.0 - progress
		var freq := lerpf(180.0, 360.0, progress)
		phase += freq / sample_rate * TAU
		var val := sin(phase) * envelope * 0.7
		var byte_val := clampi(int((val * 0.5 + 0.5) * 255.0), 0, 255)
		data[i] = byte_val

	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_8_BITS
	wav.mix_rate = sample_rate
	wav.data = data
	return wav


func _generate_double_jump() -> AudioStreamWAV:
	var sample_rate := 22050
	var duration := 0.16
	var num_samples := int(sample_rate * duration)
	var data := PackedByteArray()
	data.resize(num_samples)

	var phase := 0.0
	for i in num_samples:
		var progress := float(i) / num_samples
		var envelope := (1.0 - progress) * (1.0 - progress)
		var freq := lerpf(300.0, 650.0, progress)
		phase += freq / sample_rate * TAU
		var val := (sin(phase) + 0.3 * sin(phase * 2.0)) * envelope * 0.7
		var byte_val := clampi(int((val * 0.5 + 0.5) * 255.0), 0, 255)
		data[i] = byte_val

	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_8_BITS
	wav.mix_rate = sample_rate
	wav.data = data
	return wav


func _generate_death() -> AudioStreamWAV:
	var sample_rate := 22050
	var duration := 0.5
	var num_samples := int(sample_rate * duration)
	var data := PackedByteArray()
	data.resize(num_samples)

	var phase := 0.0
	for i in num_samples:
		var progress := float(i) / num_samples
		var envelope := exp(-progress * 4.0)
		var freq := lerpf(280.0, 50.0, progress)
		phase += freq / sample_rate * TAU
		var val := sin(phase) * envelope * 0.8
		var byte_val := clampi(int((val * 0.5 + 0.5) * 255.0), 0, 255)
		data[i] = byte_val

	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_8_BITS
	wav.mix_rate = sample_rate
	wav.data = data
	return wav
