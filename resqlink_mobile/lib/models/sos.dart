import 'dart:convert';

class SOS {
  final String id;
  final String name;
  final String need;
  final int people;
  final String location;
  final String status; // CREATED, RELAY_PENDING, RELAY_ACCEPTED, COMMAND_PENDING, DISPATCHED, COMPLETED
  final String relayDecision; // PENDING, APPROVED, REJECTED
  final String commandDecision; // PENDING, DISPATCHED, REJECTED
  final String eta;
  final DateTime timestamp;
  final DateTime lastUpdated;

  SOS({
    required this.id,
    required this.name,
    required this.need,
    required this.people,
    required this.location,
    required this.status,
    required this.relayDecision,
    required this.commandDecision,
    required this.eta,
    required this.timestamp,
    required this.lastUpdated,
  });

  SOS copyWith({
    String? status,
    String? relayDecision,
    String? commandDecision,
    String? eta,
    DateTime? lastUpdated,
  }) {
    return SOS(
      id: this.id,
      name: this.name,
      need: this.need,
      people: this.people,
      location: this.location,
      status: status ?? this.status,
      relayDecision: relayDecision ?? this.relayDecision,
      commandDecision: commandDecision ?? this.commandDecision,
      eta: eta ?? this.eta,
      timestamp: this.timestamp,
      lastUpdated: lastUpdated ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'need': need,
      'people': people,
      'location': location,
      'status': status,
      'relayDecision': relayDecision,
      'commandDecision': commandDecision,
      'eta': eta,
      'timestamp': timestamp.toIso8601String(),
      'lastUpdated': lastUpdated.toIso8601String(),
    };
  }

  factory SOS.fromMap(Map<String, dynamic> map) {
    return SOS(
      id: map['id'] ?? '',
      name: map['name'] ?? '',
      need: map['need'] ?? '',
      people: map['people'] ?? 1,
      location: map['location'] ?? '',
      status: map['status'] ?? 'CREATED',
      relayDecision: map['relayDecision'] ?? 'PENDING',
      commandDecision: map['commandDecision'] ?? 'PENDING',
      eta: map['eta'] ?? '',
      timestamp: DateTime.parse(map['timestamp']),
      lastUpdated: DateTime.parse(map['lastUpdated'] ?? map['timestamp']),
    );
  }

  String toJson() => json.encode(toMap());

  factory SOS.fromJson(String source) => SOS.fromMap(json.decode(source));
}
