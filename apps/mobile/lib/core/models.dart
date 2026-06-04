class Profile {
  Profile({
    required this.id,
    required this.role,
    this.companyId,
    this.customerId,
    this.stationId,
    this.fullName,
  });

  final String id;
  final String role;
  final String? companyId;
  final String? customerId;
  final String? stationId;
  final String? fullName;

  factory Profile.fromJson(Map<String, dynamic> json) => Profile(
        id: json['id'] as String,
        role: json['role'] as String,
        companyId: json['company_id'] as String?,
        customerId: json['customer_id'] as String?,
        stationId: json['station_id'] as String?,
        fullName: json['full_name'] as String?,
      );

  bool get isAttendant => role == 'attendant';
  bool get isCustomer => role == 'customer';
}

class VehicleLookup {
  VehicleLookup({
    required this.vehicleId,
    required this.licensePlate,
    required this.customerId,
    required this.customerName,
    this.make,
    this.model,
  });

  final String vehicleId;
  final String licensePlate;
  final String customerId;
  final String customerName;
  final String? make;
  final String? model;

  factory VehicleLookup.fromJson(Map<String, dynamic> json) => VehicleLookup(
        vehicleId: json['vehicle_id'] as String,
        licensePlate: json['license_plate'] as String,
        customerId: json['customer_id'] as String,
        customerName: json['customer_name'] as String,
        make: json['make'] as String?,
        model: json['model'] as String?,
      );
}

class Vehicle {
  Vehicle({
    required this.id,
    required this.licensePlate,
    this.make,
    this.model,
    required this.fuelType,
  });

  final String id;
  final String licensePlate;
  final String? make;
  final String? model;
  final String fuelType;

  factory Vehicle.fromJson(Map<String, dynamic> json) => Vehicle(
        id: json['id'] as String,
        licensePlate: json['license_plate'] as String,
        make: json['make'] as String?,
        model: json['model'] as String?,
        fuelType: json['fuel_type'] as String? ?? 'regular',
      );
}

class Fueling {
  Fueling({
    required this.id,
    required this.gallons,
    required this.totalCents,
    required this.createdAt,
    this.licensePlate,
    this.driverName,
  });

  final String id;
  final double gallons;
  final int totalCents;
  final DateTime createdAt;
  final String? licensePlate;
  final String? driverName;

  factory Fueling.fromJson(Map<String, dynamic> json) {
    final vehicles = json['vehicles'];
    String? plate;
    if (vehicles is Map) {
      plate = vehicles['license_plate'] as String?;
    }
    return Fueling(
      id: json['id'] as String,
      gallons: (json['gallons'] as num).toDouble(),
      totalCents: json['total_cents'] as int,
      createdAt: DateTime.parse(json['created_at'] as String),
      licensePlate: plate,
      driverName: json['driver_name'] as String?,
    );
  }
}

class Invoice {
  Invoice({
    required this.id,
    required this.periodStart,
    required this.periodEnd,
    required this.totalCents,
    required this.status,
    this.pdfPath,
  });

  final String id;
  final String periodStart;
  final String periodEnd;
  final int totalCents;
  final String status;
  final String? pdfPath;

  factory Invoice.fromJson(Map<String, dynamic> json) => Invoice(
        id: json['id'] as String,
        periodStart: json['period_start'] as String,
        periodEnd: json['period_end'] as String,
        totalCents: json['total_cents'] as int,
        status: json['status'] as String,
        pdfPath: json['pdf_path'] as String?,
      );
}
