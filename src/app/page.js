'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false });

const CREDENTIALS = {
  admin: { username: "1", password: "1", role: "Admin", fullName: "System Admin" },
  user: { username: "2", password: "2", role: "User", fullName: "On-Duty Officer" }
};

const DEFAULT_RESOURCES = [
  { id: 1, name: "Emergency Medical Kit", type: "Medical Supplies", totalQuantity: 500, availableQuantity: 350 },
  { id: 2, name: "Food Packages", type: "Food & Water", totalQuantity: 1000, availableQuantity: 800 },
  { id: 3, name: "Emergency Tents", type: "Shelter", totalQuantity: 100, availableQuantity: 75 },
  { id: 4, name: "Rescue Personnel", type: "Rescue Team", totalQuantity: 50, availableQuantity: 40 },
  { id: 5, name: "Emergency Ambulances", type: "Ambulance", totalQuantity: 20, availableQuantity: 15 },
  { id: 6, name: "Clean Drinking Water", type: "Food & Water", totalQuantity: 5000, availableQuantity: 3200 },
  { id: 7, name: "Blankets & Sleeping Bags", type: "Bedding", totalQuantity: 1500, availableQuantity: 1200 },
  { id: 8, name: "Inflatable Rescue Boats", type: "Rescue Boats", totalQuantity: 40, availableQuantity: 28 },
  { id: 9, name: "Heavy Duty Excavators (JCB)", type: "Heavy Machinery", totalQuantity: 15, availableQuantity: 10 }
];

const DEFAULT_VOLUNTEERS = [
  { id: 1, name: "Dr. Sandeep", role: "Medical", status: "available", lat: 12.5318, lng: 76.9051, phone: "9123456780" },
  { id: 2, name: "Kiran Kumar", role: "Rescue", status: "busy", lat: 12.5118, lng: 76.9151, phone: "9123456781" },
  { id: 3, name: "Arjun Singh", role: "Driver", status: "available", lat: 12.5418, lng: 76.8851, phone: "9123456782" }
];

const DUMMY_REQUESTS = [
  {
    id: 1,
    requestId: "REQ-1000",
    resourceType: "Medical Supplies",
    quantityRequested: 150,
    quantityAllocated: 100,
    quantityPending: 50,
    lat: 12.5118,
    lng: 76.8851,
    severity: 5,
    individualsAffected: 200,
    status: "partial",
    contactPerson: "Dr. Ramesh Sharma",
    contactPhone: "9876543210",
    address: "Near Mandya Railway Station, Mandya",
    description: "Critical medical supplies needed urgently for cyclone victims. Require emergency medicines, first aid kits, and antiseptics. Multiple injuries reported."
  },
  {
    id: 2,
    requestId: "REQ-1001",
    resourceType: "Food & Water",
    quantityRequested: 500,
    quantityAllocated: 0,
    quantityPending: 500,
    lat: 12.5318,
    lng: 76.9051,
    severity: 4,
    individualsAffected: 100,
    status: "pending",
    contactPerson: "Rajesh Kumar",
    contactPhone: "9876543211",
    address: "MIMS Doctors Quarters, Mandya",
    description: "Emergency food supplies and clean drinking water needed for evacuees at temporary shelter. Families include elderly and children requiring immediate assistance."
  },
  {
    id: 3,
    requestId: "REQ-1002",
    resourceType: "Shelter",
    quantityRequested: 30,
    quantityAllocated: 30,
    quantityPending: 0,
    lat: 12.5418,
    lng: 76.9051,
    severity: 3,
    individualsAffected: 50,
    status: "allocated",
    contactPerson: "Priya Nair",
    contactPhone: "9876543212",
    address: "Temple Road, Mandya",
    description: "Temporary shelter tents required for displaced families whose homes were damaged in heavy rains. Need waterproof tents with basic amenities."
  },
  {
    id: 4,
    requestId: "REQ-1003",
    resourceType: "Ambulance",
    quantityRequested: 5,
    quantityAllocated: 5,
    quantityPending: 0,
    lat: 12.5018,
    lng: 76.8951,
    severity: 5,
    individualsAffected: 25,
    status: "resolved",
    contactPerson: "Mohammed Ali",
    contactPhone: "9876543213",
    address: "Near Mandya Bus Stand, Mandya",
    description: "Emergency medical transport needed for critical patients. Several casualties with severe injuries requiring immediate hospital admission and specialized care.",
    resolvedAt: "2026-05-22T10:30:00Z"
  },
  {
    id: 5,
    requestId: "REQ-1004",
    resourceType: "Rescue Team",
    quantityRequested: 10,
    quantityAllocated: 0,
    quantityPending: 10,
    lat: 12.5218,
    lng: 76.9251,
    severity: 4,
    individualsAffected: 80,
    status: "pending",
    contactPerson: "Anil Verma",
    contactPhone: "9876543214",
    address: "Industrial Area, Mandya",
    description: "Rescue operation urgently needed for people stranded in flooded area. Water level rising rapidly. Require boats and trained rescue personnel immediately."
  }
];

const TRANSLATIONS = {
  en: {
    title: "ResQ Link",
    base: "Base: Mandya Emergency Operations Center (MIMS)",
    hw_title: "Live Hardware Monitoring (Supabase)",
    temp: "Temperature",
    hum: "Humidity",
    soil: "Soil Moisture",
    water: "Water Level",
    seismic: "Seismic Activity",
    air: "Air Quality",
    rain: "Rain Intensity",
    pressure: "Pressure",
    altitude: "Altitude",
    windSpeed: "Wind Speed",
    windDir: "Wind Direction",
    submit_req: "Submit Emergency Request",
    res_type: "Resource Type",
    qty: "Quantity",
    severity: "Severity (1-5)",
    affected: "Individuals Affected",
    desc: "Description",
    submit_btn: "Submit Request",
    sos_btn: "SOS",
    sos_label: "Instant Emergency Help",
    logout: "Logout",
    active_req: "Active Emergency Requests",
    resolved_req: "Resolved Requests",
    avail_res: "Available Resources",
    join_vol: "Join as a Volunteer",
    name: "Full Name",
    expertise: "Expertise",
    phone: "Phone Number",
    reg_vol: "Register as Volunteer",
    avail_supplies: "Available Supplies",
    normal_mode: "Normal Mode",
    tactical_mode: "Tactical Mode",
    total_req: "Total Requests",
    active_req_short: "Active Requests",
    resolved_req_short: "Resolved Requests",
    critical_priority: "Critical Priority",
    ai_assistant: "ResQLink AI Assistant",
    gen_report: "Generate Situation Report",
    ai_helper_text: "Click 'Generate Situation Report' to get an AI analysis of the current environment logs.",
    analyzing_data: "Analyzing data...",
    weather_forecast: "Weather Forecast",
    loading_weather: "Loading weather details...",
    command_map: "Emergency Command Map",
    live_deployment: "LIVE DEPLOYMENT",
    last_sync: "Last Sync",
    city_name: "City Name",
    weather_desc: "Weather Description",
    feels_like: "Feels Like",
    visibility: "Visibility",
    cloudiness: "Cloudiness",
    coordinates: "Coordinates",
    timezone: "Timezone",
    location_map: "Emergency Location Map",
    submit_req_admin: "Submit Emergency Request (Admin)",
    on_duty_vols: "On-Duty Volunteers",
    sys_analytics: "System Analytics & Predictions",
    resolved_history: "Resolved Requests History",
    local_weather: "Local Weather",
    live_sensor_data: "Live Sensor Data",
    allocate_resources: "Allocate Resources",
    route_info: "Route Info",
    edit_resource: "Edit Resource",
    add_resource: "Add Resource",
    welcome_back: "Welcome Back",
    login_sub: "Sign in to your account",
    username: "Username",
    password: "Password",
    login_btn: "Login",
    demo_btn: "Use Demo Admin Credentials",
    dont_have_account: "Don't have an account? Register new account",
    disaster_mgmt: "Disaster Response Management System",
    join_resq: "Join ResQ Link",
    create_account_sub: "Create your account to get started",
    account_security: "Account Security",
    confirm_password: "Confirm Password",
    retype_password: "Retype Password",
    choose_username: "Choose a unique username",
    min_chars: "Min 6 characters",
    account_type: "Account Type",
    standard_fn: "Standard Functionality",
    sys_mgmt: "System Management",
    create_account_btn: "Create Account",
    already_have_account: "Already have an account? Login here",
    type: "Type",
    qty_short: "Qty",
    location: "Location",
    person: "Person",
    phone_short: "Phone",
    priority: "Priority",
    status: "Status",
    actions: "Actions",
    id: "ID",
    resolved_at: "Resolved At",
    critical_first: "Critical First",
    low_first: "Low Risk First",
    purge: "Purge",
    allocate: "Allocate",
    resolve: "Resolve",
    route: "Route",
    ml_priority: "Real-time ML Priority",
    confidence: "Confidence",
    sos_hint: "One-click alert with your mobile GPS telemetry",
    medical_first_aid: "Medical / First Aid",
    rescue_search: "Rescue / Search",
    driver_logistics: "Driver / Logistics",
    general_assistance: "General Assistance",
    weather_syncing: "Weather readings syncing...",
    req_details: "Request Details",
    qty_to_allocate: "Quantity to Allocate",
    cancel: "Cancel",
    distance: "Distance",
    est_time: "Estimated Time",
    severity_level: "Severity Level",
    ok: "OK",
    resource_name: "Resource Name",
    total_qty: "Total Quantity",
    avail_qty: "Available Quantity",
    save: "Save",
    pinned_target: "Pinned Target",
    map_pin_required: "🚨 Map Target Pin Required",
    dispatch: "Dispatch",
    admin: "Admin",
    from_north: "from North",
    exhaustion_forecast: "Inventory Exhaustion Forecast",
    hrs_left: "hrs left",
    burn_rate: "Burn Rate",
    units_hr: "units/hr",
    risk: "RISK",
    avg_priority: "Avg Priority",
    people_helped: "People Helped",
    utilization: "Utilization",
    avg_response_time: "Avg Response Time",
    coords_locked: "Coords Locked",
    pin_target_required: "🚨 Pinned target coords required (Click Map)"
  },
  kn: {
    title: "ರೆಸ್ಕ್ಯೂ ಲಿಂಕ್",
    base: "ನೆಲೆ: ಮಂಡ್ಯ ತುರ್ತು ಕಾರ್ಯಾಚರಣೆ ಕೇಂದ್ರ (ಮಿಮ್ಸ್)",
    hw_title: "ಲೈವ್ ಹಾರ್ಡ್‌ವೇರ್ ಮಾನಿಟರಿಂಗ್ (ಸುಪಬೇಸ್)",
    temp: "ತಾಪಮಾನ",
    hum: "ಆರ್ದ್ರತೆ",
    soil: "ಮಣ್ಣಿನ ತೇವಾಂಶ",
    water: "ನೀರಿನ ಮಟ್ಟ",
    seismic: "ಭೂಕಂಪನ ಚಟುವಟಿಕೆ",
    air: "ಗಾಳಿಯ ಗುಣಮಟ್ಟ",
    rain: "ಮಳೆಯ ತೀವ್ರತೆ",
    pressure: "ಒತ್ತಡ",
    altitude: "ಎತ್ತರ",
    windSpeed: "ಗಾಳಿಯ ವೇಗ",
    windDir: "ಗಾಳಿಯ ದಿಕ್ಕು",
    submit_req: "ತುರ್ತು ವಿನಂತಿಯನ್ನು ಸಲ್ಲಿಸಿ",
    res_type: "ಸಂಪನ್ಮೂಲ ಪ್ರಕಾರ",
    qty: "ಪ್ರಮಾಣ",
    severity: "ತೀವ್ರತೆ (1-5)",
    affected: "ಪೀಡಿತ ವ್ಯಕ್ತಿಗಳು",
    desc: "ವಿವರಣೆ",
    submit_btn: "ವಿನಂತಿಯನ್ನು ಸಲ್ಲಿಸಿ",
    sos_btn: "ಎಸ್ಒಎಸ್",
    sos_label: "ತತ್ಕ್ಷಣ ತುರ್ತು ಸಹಾಯ",
    logout: "ನಿರ್ಗಮಿಸಿ",
    active_req: "ಸಕ್ರಿಯ ತುರ್ತು ವಿನಂತಿಗಳು",
    resolved_req: "ಪರಿಹರಿಸಲಾದ ವಿನಂತಿಗಳು",
    avail_res: "ಲಭ್ಯವಿರುವ ಸಂಪನ್ಮೂಲಗಳು",
    join_vol: "ಸ್ವಯಂಸೇವಕರಾಗಿ ಸೇರಿ",
    name: "ಪೂರ್ಣ ಹೆಸರು",
    expertise: "ಪರಿಣತಿ",
    phone: "ದೂರವಾಣಿ ಸಂಖ್ಯೆ",
    reg_vol: "ಸ್ವಯಂಸೇವಕರಾಗಿ ನೋಂದಾಯಿಸಿ",
    avail_supplies: "ಲಭ್ಯವಿರುವ ಸರಬರಾಜುಗಳು",
    normal_mode: "ಸಾಮಾನ್ಯ ಮೋಡ್",
    tactical_mode: "ಯುದ್ಧತಂತ್ರದ ಮೋಡ್",
    total_req: "ಒಟ್ಟು ವಿನಂತಿಗಳು",
    active_req_short: "ಸಕ್ರಿಯ ವಿನಂತಿಗಳು",
    resolved_req_short: "ಪರಿಹರಿಸಲಾದ ವಿನಂತಿಗಳು",
    critical_priority: "ಗಂಭೀರ ಆದ್ಯತೆ",
    ai_assistant: "ರೆಸ್ಕ್ಯೂಲಿಂಕ್ AI ಸಹಾಯಕಿ",
    gen_report: "ಪರಿಸ್ಥಿತಿ ವರದಿ ರಚಿಸಿ",
    ai_helper_text: "ಪ್ರಸ್ತುತ ಪರಿಸರದ ಲಾಗ್‌ಗಳ AI ವಿಶ್ಲೇಷಣೆಯನ್ನು ಪಡೆಯಲು 'ಪರಿಸ್ಥಿತಿ ವರದಿ ರಚಿಸಿ' ಕ್ಲಿಕ್ ಮಾಡಿ.",
    analyzing_data: "ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
    weather_forecast: "ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ",
    loading_weather: "ಹವಾಮಾನ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    command_map: "ತುರ್ತು ನಿಯಂತ್ರಣ ನಕ್ಷೆ",
    live_deployment: "ಲೈವ್ ನಿಯೋಜನೆ",
    last_sync: "ಕೊನೆಯ ಸಿಂಕ್",
    city_name: "ನಗರದ ಹೆಸರು",
    weather_desc: "ಹವಾಮಾನ ವಿವರಣೆ",
    feels_like: "ಹಾಗೆ ಭಾಸವಾಗುತ್ತದೆ",
    visibility: "ಗೋಚರತೆ",
    cloudiness: "ಮೋಡ ಕವಿದ ವಾತಾವರಣ",
    coordinates: "ನಿರ್ದೇಶಾಂಕಗಳು",
    timezone: "ಸಮಯ ವಲಯ",
    location_map: "ತುರ್ತು ಸ್ಥಳ ನಕ್ಷೆ",
    submit_req_admin: "ತುರ್ತು ವಿನಂತಿ ಸಲ್ಲಿಸಿ (ನಿರ್ವಾಹಕರು)",
    on_duty_vols: "ಕರ್ತವ್ಯದಲ್ಲಿರುವ ಸ್ವಯಂಸೇವಕರು",
    sys_analytics: "ವ್ಯವಸ್ಥೆ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಮುನ್ಸೂಚನೆಗಳು",
    resolved_history: "ಪರಿಹರಿಸಲಾದ ವಿನಂತಿಗಳ ಇತಿಹಾಸ",
    local_weather: "ಸ್ಥಳೀಯ ಹವಾಮಾನ",
    live_sensor_data: "ಲೈವ್ ಸೆನ್ಸರ್ ಡೇಟಾ",
    allocate_resources: "ಸಂಪನ್ಮೂಲಗಳನ್ನು ಹಂಚಿಕೆ ಮಾಡಿ",
    route_info: "ಮಾರ್ಗ ಮಾಹಿತಿ",
    edit_resource: "ಸಂಪನ್ಮೂಲವನ್ನು ಸಂಪಾದಿಸಿ",
    add_resource: "ಸಂಪನ್ಮೂಲವನ್ನು ಸೇರಿಸಿ",
    welcome_back: "ಪುನಃ ಸುಸ್ವಾಗತ",
    login_sub: "ನಿಮ್ಮ ಖಾತೆಗೆ ಲಾಗಿನ್ ಮಾಡಿ",
    username: "ಬಳಕೆದಾರ ಹೆಸರು",
    password: "ಗುಪ್ತಪದ",
    login_btn: "ಲಾಗಿನ್",
    demo_btn: "ಡೆಮೊ ನಿರ್ವಾಹಕ ರುಜುವಾತುಗಳನ್ನು ಬಳಸಿ",
    dont_have_account: "ಖಾತೆ ಇಲ್ಲವೇ? ಹೊಸದನ್ನು ರಚಿಸಿ",
    disaster_mgmt: "ವಿಪತ್ತು ಪ್ರತಿಕ್ರಿಯೆ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ",
    join_resq: "ರೆಸ್ಕ್ಯೂ ಲಿಂಕ್ ಸೇರಿ",
    create_account_sub: "ಪ್ರಾರಂಭಿಸಲು ನಿಮ್ಮ ಖಾತೆಯನ್ನು ರಚಿಸಿ",
    account_security: "ಖಾತೆ ಭದ್ರತೆ",
    confirm_password: "ದೃಢೀಕರಿಸಿ",
    retype_password: "ಗುಪ್ತಪದವನ್ನು ಮರುಟೈಪ್ ಮಾಡಿ",
    choose_username: "ವಿಶಿಷ್ಟ ಬಳಕೆದಾರ ಹೆಸರನ್ನು ಆರಿಸಿ",
    min_chars: "ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳು",
    account_type: "ಖಾತೆಯ ಪ್ರಕಾರ",
    standard_fn: "ಸಾಮಾನ್ಯ ಕಾರ್ಯಶೀಲತೆ",
    sys_mgmt: "ಸಿಸ್ಟಮ್ ನಿರ್ವಹಣೆ",
    create_account_btn: "ಖಾತೆ ರಚಿಸಿ",
    already_have_account: "ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ? ಲಾಗಿನ್ ಮಾಡಿ",
    type: "ಪ್ರಕಾರ",
    qty_short: "ಪ್ರಮಾಣ",
    location: "ಸ್ಥಳ",
    person: "ಸಂಪರ್ಕ ವ್ಯಕ್ತಿ",
    phone_short: "ಫೋನ್",
    priority: "ಆದ್ಯತೆ",
    status: "ಸ್ಥಿತಿ",
    actions: "ಕ್ರಮಗಳು",
    id: "ಐಡಿ",
    resolved_at: "ಪರಿಹರಿಸಲಾದ ಸಮಯ",
    critical_first: "ಗಂಭೀರ ಮೊದಲು",
    low_first: "ಕಡಿಮೆ ಆದ್ಯತೆ ಮೊದಲು",
    purge: "ಅಳಿಸಿ",
    allocate: "ಹಂಚಿಕೆ",
    resolve: "ಪರಿಹರಿಸಿ",
    route: "ಮಾರ್ಗ",
    ml_priority: "ನೈಜ-ಸಮಯದ ML ಆದ್ಯತೆ",
    confidence: "ವಿಶ್ವಾಸಾರ್ಹತೆ",
    sos_hint: "ನಿಮ್ಮ ಮೊಬೈಲ್ ಜಿಪಿಎಸ್ ಟೆಲಿಮೆಟ್ರಿಯೊಂದಿಗೆ ಒಂದೇ ಕ್ಲಿಕ್‌ನಲ್ಲಿ ಎಚ್ಚರಿಕೆ",
    medical_first_aid: "ವೈದ್ಯಕೀಯ / ಪ್ರಥಮ ಚಿಕಿತ್ಸೆ",
    rescue_search: "ರಕ್ಷಣೆ / ಹುಡುಕಾಟ",
    driver_logistics: "ಚಾಲಕ / ಲಾಜಿಸ್ಟಿಕ್ಸ್",
    general_assistance: "ಸಾಮಾನ್ಯ ಸಹಾಯ",
    weather_syncing: "ಹವಾಮಾನ ವಿವರಗಳು ಸಿಂಕ್ ಆಗುತ್ತಿವೆ...",
    req_details: "ವಿನಂತಿಯ ವಿವರಗಳು",
    qty_to_allocate: "ಹಂಚಿಕೆ ಮಾಡಬೇಕಾದ ಪ್ರಮಾಣ",
    cancel: "ರದ್ದುಮಾಡಿ",
    distance: "ದೂರ",
    est_time: "ಅಂದಾಜು ಸಮಯ",
    severity_level: "ತೀವ್ರತೆಯ ಮಟ್ಟ",
    ok: "ಸರಿ",
    resource_name: "ಸಂಪನ್ಮೂಲ ಹೆಸರು",
    total_qty: "ಒಟ್ಟು ಪ್ರಮಾಣ",
    avail_qty: "ಲಭ್ಯವಿರುವ ಪ್ರಮಾಣ",
    save: "ಉಳಿಸಿ",
    pinned_target: "ಪಿನ್ ಮಾಡಿದ ಗುರಿ",
    map_pin_required: "🚨 ನಕ್ಷೆಯಲ್ಲಿ ಗುರಿ ಗುರುತಿಸುವುದು ಅಗತ್ಯ",
    dispatch: "ನಿಯೋಜಿಸು",
    admin: "ನಿರ್ವಾಹಕರು",
    from_north: "ಉತ್ತರದಿಂದ",
    exhaustion_forecast: "ದಾಸ್ತಾನು ಖಾಲಿಯಾಗುವ ಮುನ್ಸೂಚನೆ",
    hrs_left: "ಗಂಟೆಗಳು ಬಾಕಿ",
    burn_rate: "ಬಳಕೆಯ ದರ",
    units_hr: "ಘಟಕಗಳು/ಗಂಟೆ",
    risk: "ಅಪಾಯ",
    avg_priority: "ಸರಾಸರಿ ಆದ್ಯತೆ",
    people_helped: "ಸಹಾಯ ಪಡೆದ ಜನರು",
    utilization: "ಬಳಕೆ ದರ",
    avg_response_time: "ಸರಾಸರಿ ಪ್ರತಿಕ್ರಿಯೆ ಸಮಯ",
    coords_locked: "ನಿರ್ದೇಶಾಂಕಗಳನ್ನು ಲಾಕ್ ಮಾಡಲಾಗಿದೆ",
    pin_target_required: "🚨 ಪಿನ್ ಮಾಡಿದ ಗುರಿಯ ನಿರ್ದೇಶಾಂಕಗಳು ಅಗತ್ಯವಿದೆ (ನಕ್ಷೆಯ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ)"
  }
};

const WEATHER_API_KEY = "ffc79bc9d96b20005a62a24e1f39113a";

export default function Home() {
  // Toast Notification State
  const [toast, setToast] = useState({ message: '', type: '', visible: false });
  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

  // Authentication & Session
  const [currentUser, setCurrentUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  // Registration Form
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState('User');
  const [regError, setRegError] = useState('');

  // Core Data State
  const [requests, setRequests] = useState([]);
  const [resources, setResources] = useState(DEFAULT_RESOURCES);
  const [volunteers, setVolunteers] = useState(DEFAULT_VOLUNTEERS);
  const [nextRequestId, setNextRequestId] = useState(1005);

  // Map & Location State
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeData, setRouteData] = useState(null);
  const [showRouteModal, setShowRouteModal] = useState(false);

  // Weather & Sensors
  const [weatherData, setWeatherData] = useState(null);
  const [sensorData, setSensorData] = useState({
    temperature: 24.5,
    humidity: 62.0,
    soil_moisture: 2100,
    water_level: 120.0,
    seismic: 0.05,
    air_quality: 180,
    rain_level: 0,
    baro_pressure: 1011.5,
    altitude: 770.0,
    wind_speed: 12.5,
    wind_direction: 190,
    latitude: 0,
    longitude: 0,
    status: "Updated",
    created_at: new Date().toISOString()
  });

  // Settings & Accessibility
  const [lang, setLang] = useState('en');
  const [tacticalMode, setTacticalMode] = useState(false);
  const [mobileView, setMobileView] = useState(false);

  // Collapsible UI panels
  const [isHardwareExpanded, setIsHardwareExpanded] = useState(false);
  const [isWeatherExpanded, setIsWeatherExpanded] = useState(false);
  const [isVolunteerFormExpanded, setIsVolunteerFormExpanded] = useState(false);
  const [isUserResourcesExpanded, setIsUserResourcesExpanded] = useState(false);

  // AI Assistant State
  const [aiSummaryOutput, setAiSummaryOutput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Sort Risk Level
  const [riskSort, setRiskSort] = useState('critical');

  // Modals & Allocation Inputs
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocateRequest, setAllocateRequest] = useState(null);
  const [allocateQtyVal, setAllocateQtyVal] = useState('');

  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resourceModalData, setResourceModalData] = useState({ id: '', name: '', type: '', totalQuantity: '', availableQuantity: '' });

  // User Dashboard Form Inputs
  const [userResourceType, setUserResourceType] = useState('');
  const [userQuantity, setUserQuantity] = useState('');
  const [userSeverity, setUserSeverity] = useState('');
  const [userIndividuals, setUserIndividuals] = useState('');
  const [userDescription, setUserDescription] = useState('');

  // Admin Dashboard Form Inputs
  const [adminResourceType, setAdminResourceType] = useState('');
  const [adminQuantity, setAdminQuantity] = useState('');
  const [adminSeverity, setAdminSeverity] = useState('');
  const [adminIndividuals, setAdminIndividuals] = useState('');
  const [adminContact, setAdminContact] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminDescription, setAdminDescription] = useState('');

  // Volunteer Join Inputs
  const [volName, setVolName] = useState('');
  const [volRole, setVolRole] = useState('Medical');
  const [volPhone, setVolPhone] = useState('');

  const routeTimeoutRef = useRef(null);
  const routeModalTimeoutRef = useRef(null);

  const t = TRANSLATIONS[lang];

  // 1. Initial Load & Setup
  useEffect(() => {
    // Restore User Session
    const savedUser = localStorage.getItem('drmsCurrentUser');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('drmsCurrentUser');
      }
    }

    // Restore Settings
    const savedLang = localStorage.getItem('resqlink_lang');
    if (savedLang) setLang(savedLang);

    const savedTactical = localStorage.getItem('tacticalMode') === 'true';
    setTacticalMode(savedTactical);

    const savedMobile = localStorage.getItem('mobileViewActive') === 'true';
    setMobileView(savedMobile);

    // Load requests from server, fallback to seeded DUMMY_REQUESTS if empty/fails
    const loadRequests = async () => {
      try {
        const res = await fetch('/api/requests');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const mapped = data.map(req => {
              const mlResult = calculateMLPriority(req.resourceType, req.individualsAffected, req.severity);
              return {
                ...req,
                id: req.id || req.requestId,
                priorityScore: mlResult.priorityScore,
                mlPriorityClass: mlResult.priorityClass,
                mlConfidence: mlResult.mlConfidence / 100
              };
            });
            setRequests(mapped);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load requests from server:", err);
      }

      const seededRequests = DUMMY_REQUESTS.map(req => {
        const mlResult = calculateMLPriority(req.resourceType, req.individualsAffected, req.severity);
        return {
          ...req,
          priorityScore: mlResult.priorityScore,
          mlPriorityClass: mlResult.priorityClass,
          mlConfidence: mlResult.mlConfidence / 100
        };
      });
      setRequests(seededRequests);
    };

    loadRequests();
  }, []);

  // Sync Body CSS Styles
  useEffect(() => {
    if (tacticalMode) {
      document.body.classList.add('tactical-mode');
    } else {
      document.body.classList.remove('tactical-mode');
    }
    localStorage.setItem('tacticalMode', tacticalMode);
  }, [tacticalMode]);

  useEffect(() => {
    if (mobileView) {
      document.body.classList.add('mobile-view-active');
    } else {
      document.body.classList.remove('mobile-view-active');
    }
    localStorage.setItem('mobileViewActive', mobileView);
  }, [mobileView]);

  // Sync base position for map and fetch weather
  const currentBaseLocation = useMemo(() => {
    if (sensorData.latitude && sensorData.longitude) {
      return {
        lat: sensorData.latitude,
        lng: sensorData.longitude,
        name: "Dynamic Telemetry Node"
      };
    }
    return {
      lat: 12.5218,
      lng: 76.8951,
      name: "MIMS-MDY"
    };
  }, [sensorData.latitude, sensorData.longitude]);

  useEffect(() => {
    fetchWeather(currentBaseLocation.lat, currentBaseLocation.lng);
  }, [currentBaseLocation, lang]);

  // 2. Real-Time Supabase Subscription
  useEffect(() => {
    let channel = null;

    const setupSupabase = async () => {
      try {
        const res = await fetch('/api/config');
        const config = await res.json();

        if (config.SUPABASE_URL && config.SUPABASE_ANON_KEY) {
          const { createClient } = require('@supabase/supabase-js');
          const sbClient = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

          // Get latest log
          const { data, error } = await sbClient
            .from('sensor_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

          if (data && data.length > 0) {
            setSensorData(data[0]);
          }

          // Live channel
          channel = sbClient
            .channel('sensor_logs_changes')
            .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'sensor_logs' },
              (payload) => {
                setSensorData(payload.new);
              }
            )
            .subscribe();
        }
      } catch (err) {
        console.error("Supabase config error:", err);
      }
    };

    setupSupabase();

    // Fallback simulation timer if Supabase is offline (so cards show active updates)
    const interval = setInterval(() => {
      setSensorData(prev => ({
        ...prev,
        temperature: parseFloat((prev.temperature + (Math.random() - 0.5) * 0.2).toFixed(1)),
        humidity: parseFloat(Math.min(100, Math.max(0, prev.humidity + (Math.random() - 0.5) * 0.5)).toFixed(1)),
        soil_moisture: Math.max(0, prev.soil_moisture + Math.floor((Math.random() - 0.5) * 20)),
        water_level: parseFloat(Math.max(0, prev.water_level + (Math.random() - 0.5) * 1.5).toFixed(1)),
        seismic: parseFloat(Math.max(0, 0.02 + Math.random() * 0.1).toFixed(2)),
        created_at: new Date().toISOString()
      }));
    }, 10000);

    return () => {
      if (channel) channel.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // 3. API Requests & Helper Functions
  const fetchWeather = (lat, lng) => {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric&lang=${lang === 'kn' ? 'kn' : 'en'}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.main) setWeatherData(data);
      })
      .catch(err => console.error('Error fetching weather:', err));
  };

  const getAISummary = async () => {
    setIsAiLoading(true);
    setAiSummaryOutput(lang === 'kn' ? "ಟೆಲಿಮೆಟ್ರಿ ವೆಕ್ಟರ್‌ಗಳು ಮತ್ತು ಸಂಕಲಿಸಿದ ವರದಿಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ..." : "Analyzing telemetry vectors and compiled reports...");
    try {
      const response = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sensorData, lang })
      });
      const data = await response.json();
      if (data.summary) {
        setAiSummaryOutput(data.summary);
      } else {
        setAiSummaryOutput(lang === 'kn' ? "AI ಲಾಗ್‌ಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಸ್ಥಳೀಯ gemma4:latest ಪ್ರತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ." : "AI failed to infer logs. Please check local gemma4:latest instance.");
      }
    } catch (err) {
      setAiSummaryOutput(lang === 'kn' ? "ಆಫ್‌ಲೈನ್: ದಯವಿಟ್ಟು 'gemma4:latest' ಮಾದರಿಯೊಂದಿಗೆ ಸ್ಥಳೀಯ Ollama ರನ್ ಆಗುತ್ತಿರುವುದನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ." : "Offline: Please verify local Ollama daemon is running with model 'gemma4:latest'.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const calculateMLPriority = (resourceType, individualsAffected, severity) => {
    let priorityClass = 'low';
    let baseScore = 0;

    if (resourceType === 'Ambulance' || resourceType === 'Rescue Team') {
      if (individualsAffected >= 25) {
        priorityClass = 'critical';
        baseScore = 120;
      } else if (individualsAffected >= 5) {
        priorityClass = 'high';
        baseScore = 70;
      } else {
        priorityClass = 'medium';
        baseScore = 40;
      }
    } else if (resourceType === 'Medical Supplies') {
      if (individualsAffected >= 100 || (individualsAffected >= 50 && severity >= 4)) {
        priorityClass = 'critical';
        baseScore = 110;
      } else if (individualsAffected >= 50 || (individualsAffected >= 25 && severity >= 4)) {
        priorityClass = 'high';
        baseScore = 65;
      } else if (individualsAffected >= 10) {
        priorityClass = 'medium';
        baseScore = 35;
      } else {
        priorityClass = 'low';
        baseScore = 15;
      }
    } else if (resourceType === 'Food & Water') {
      if (individualsAffected >= 200) {
        priorityClass = 'critical';
        baseScore = 105;
      } else if (individualsAffected >= 100) {
        priorityClass = 'high';
        baseScore = 60;
      } else if (individualsAffected >= 30) {
        priorityClass = 'medium';
        baseScore = 32;
      } else {
        priorityClass = 'low';
        baseScore = 12;
      }
    } else if (resourceType === 'Shelter') {
      if (individualsAffected >= 150) {
        priorityClass = 'critical';
        baseScore = 108;
      } else if (individualsAffected >= 80) {
        priorityClass = 'high';
        baseScore = 62;
      } else if (individualsAffected >= 20) {
        priorityClass = 'medium';
        baseScore = 30;
      } else {
        priorityClass = 'low';
        baseScore = 10;
      }
    }

    const finalScore = baseScore + (severity * 3);
    const confidence = Math.min(95, 75 + Math.floor(Math.random() * 15));

    return {
      priorityClass,
      priorityScore: finalScore,
      mlConfidence: confidence
    };
  };

  // Live forecasting calculations
  const forecasts = useMemo(() => {
    return resources.map(res => {
      const relevantRequests = requests.filter(r => r.resourceType === res.type && r.status !== 'resolved');
      const hourlyRate = (relevantRequests.length * 0.8) + 1.2;
      const hoursLeft = (res.availableQuantity / hourlyRate).toFixed(1);
      const riskStatus = hoursLeft < 12 ? "critical" : (hoursLeft < 24 ? "high" : "low");

      return {
        ...res,
        hoursLeft,
        hourlyRate: hourlyRate.toFixed(1),
        riskStatus
      };
    });
  }, [resources, requests]);

  // Analytics Metrics
  const avgPriority = useMemo(() => {
    const active = requests.filter(r => r.status !== 'resolved');
    if (active.length === 0) return 0.0;
    const sum = active.reduce((acc, curr) => acc + (curr.priorityScore || 0), 0);
    return (sum / active.length).toFixed(1);
  }, [requests]);

  const peopleHelped = useMemo(() => {
    const resolved = requests.filter(r => r.status === 'resolved');
    return resolved.reduce((acc, curr) => acc + (curr.individualsAffected || 0), 0);
  }, [requests]);

  const resourceUtilization = useMemo(() => {
    const total = resources.reduce((acc, curr) => acc + curr.totalQuantity, 0);
    const available = resources.reduce((acc, curr) => acc + curr.availableQuantity, 0);
    if (total === 0) return 0;
    return (((total - available) / total) * 100).toFixed(0);
  }, [resources]);

  // Map Click Location Handlers
  const handleMapClick = (latlng) => {
    setSelectedLocation(latlng);
  };

  // Sorted Requests
  const sortedRequests = useMemo(() => {
    const active = requests.filter(r => r.status !== 'resolved');
    const resolved = requests.filter(r => r.status === 'resolved');
    
    const sortFn = (a, b) => {
      if (riskSort === 'critical') {
        return (b.priorityScore || 0) - (a.priorityScore || 0);
      }
      return (a.priorityScore || 0) - (b.priorityScore || 0);
    };

    return {
      active: [...active].sort(sortFn),
      resolved: [...resolved].sort((a, b) => new Date(b.resolvedAt) - new Date(a.resolvedAt))
    };
  }, [requests, riskSort]);

  // 4. Form Submit & Dispatch Methods
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setAuthError('');

    const username = usernameInput.trim();
    const password = passwordInput;

    if (username === CREDENTIALS.admin.username && password === CREDENTIALS.admin.password) {
      setCurrentUser(CREDENTIALS.admin);
      localStorage.setItem('drmsCurrentUser', JSON.stringify(CREDENTIALS.admin));
    } else if (username === CREDENTIALS.user.username && password === CREDENTIALS.user.password) {
      setCurrentUser(CREDENTIALS.user);
      localStorage.setItem('drmsCurrentUser', JSON.stringify(CREDENTIALS.user));
    } else {
      setAuthError('Invalid credentials. Check username or password.');
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setRegError('');

    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match');
      return;
    }

    showToast('Demo registration completed. You can now login with local credentials.', 'success');
    setShowRegister(false);
    setRegUsername('');
    setRegPassword('');
    setRegConfirmPassword('');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('drmsCurrentUser');
    setShowRegister(false);
    setUsernameInput('');
    setPasswordInput('');
  };

  const fillDemoCredentials = () => {
    setUsernameInput('1');
    setPasswordInput('1');
  };

  const handleUserRequestSubmit = (e) => {
    e.preventDefault();
    if (!selectedLocation) {
      showToast('Please click on the map to specify coordinates first.', 'error');
      return;
    }

    const qty = parseInt(userQuantity);
    const sev = parseInt(userSeverity);
    const affected = parseInt(userIndividuals);

    const mlResult = calculateMLPriority(userResourceType, affected, sev);

    const newRequest = {
      id: requests.length + 1,
      requestId: `REQ-${nextRequestId}`,
      resourceType: userResourceType,
      quantityRequested: qty,
      quantityAllocated: 0,
      quantityPending: qty,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      severity: sev,
      individualsAffected: affected,
      status: 'pending',
      priorityScore: parseFloat(mlResult.priorityScore.toFixed(1)),
      mlPriorityClass: mlResult.priorityClass,
      mlConfidence: parseFloat((mlResult.mlConfidence / 100).toFixed(2)),
      contactPerson: currentUser ? currentUser.fullName : "Field Dispatcher",
      contactPhone: "N/A",
      description: userDescription
    };

    setRequests(prev => [newRequest, ...prev]);
    setNextRequestId(prev => prev + 1);

    // Save request to server DB persistently
    fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRequest)
    }).catch(err => console.error("Error saving request to server:", err));

    // Reset Form
    setUserResourceType('');
    setUserQuantity('');
    setUserSeverity('');
    setUserIndividuals('');
    setUserDescription('');
    setSelectedLocation(null);

    showToast('Emergency request submitted successfully!', 'success');
  };

  const handleAdminRequestSubmit = (e) => {
    e.preventDefault();
    if (!selectedLocation) {
      showToast('Please select coordinates on the map.', 'error');
      return;
    }

    const qty = parseInt(adminQuantity);
    const sev = parseInt(adminSeverity);
    const affected = parseInt(adminIndividuals);

    const mlResult = calculateMLPriority(adminResourceType, affected, sev);

    const newRequest = {
      id: requests.length + 1,
      requestId: `REQ-${nextRequestId}`,
      resourceType: adminResourceType,
      quantityRequested: qty,
      quantityAllocated: 0,
      quantityPending: qty,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      severity: sev,
      individualsAffected: affected,
      status: 'pending',
      priorityScore: parseFloat(mlResult.priorityScore.toFixed(1)),
      mlPriorityClass: mlResult.priorityClass,
      mlConfidence: parseFloat((mlResult.mlConfidence / 100).toFixed(2)),
      contactPerson: adminContact,
      contactPhone: adminPhone,
      description: adminDescription
    };

    setRequests(prev => [newRequest, ...prev]);
    setNextRequestId(prev => prev + 1);

    // Save request to server DB persistently
    fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRequest)
    }).catch(err => console.error("Error saving request to server:", err));

    // Reset Form
    setAdminResourceType('');
    setAdminQuantity('');
    setAdminSeverity('');
    setAdminIndividuals('');
    setAdminContact('');
    setAdminPhone('');
    setAdminDescription('');
    setSelectedLocation(null);

    showToast('Emergency request submitted successfully!', 'success');
  };

  const handleVolunteerRegister = (e) => {
    e.preventDefault();
    const newVol = {
      id: volunteers.length + 1,
      name: volName,
      role: volRole,
      phone: volPhone,
      status: 'available',
      lat: currentBaseLocation.lat + (Math.random() - 0.5) * 0.04,
      lng: currentBaseLocation.lng + (Math.random() - 0.5) * 0.04
    };

    setVolunteers(prev => [...prev, newVol]);
    showToast(`Thank you ${volName}! You are registered as ${volRole} volunteer.`, 'success');
    setVolName('');
    setVolPhone('');
  };

  const handleDispatchVolunteer = (volId) => {
    const activeReqs = requests.filter(r => r.status === 'pending');
    if (activeReqs.length === 0) {
      showToast("No pending requests to dispatch volunteers to.", 'warning');
      return;
    }
    const target = activeReqs[0];
    setVolunteers(prev => prev.map(v => v.id === volId ? { ...v, status: 'busy' } : v));
    showToast(`Dispatched volunteer to ${target.requestId} (${target.resourceType}) site.`, 'success');
  };

  const handleShowRoute = (request) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${currentBaseLocation.lng},${currentBaseLocation.lat};${request.lng},${request.lat}?overview=full&geometries=geojson`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.code === 'Ok' && data.routes.length > 0) {
          const route = data.routes[0];
          const distance = (route.distance / 1000).toFixed(2);
          const duration = Math.round(route.duration / 60);

          setRouteData({
            distance,
            duration,
            location: `Lat: ${request.lat.toFixed(4)}, Lng: ${request.lng.toFixed(4)}`,
            contactPerson: request.contactPerson,
            contactPhone: request.contactPhone,
            individualsAffected: request.individualsAffected,
            severity: request.severity,
            description: request.description
          });

          const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setRouteCoordinates(coordinates);
          setShowRouteModal(true);

          fetchWeather(request.lat, request.lng);

          if (routeTimeoutRef.current) clearTimeout(routeTimeoutRef.current);
          routeTimeoutRef.current = setTimeout(() => {
            setRouteCoordinates([]);
            fetchWeather(currentBaseLocation.lat, currentBaseLocation.lng);
          }, 20000);

          if (routeModalTimeoutRef.current) clearTimeout(routeModalTimeoutRef.current);
          routeModalTimeoutRef.current = setTimeout(() => {
            setShowRouteModal(false);
          }, 8000);
        }
      })
      .catch(err => {
        console.error('Error fetching route:', err);
        showToast('Route mapping connection timed out.', 'error');
      });
  };

  const handleSOSPanic = () => {
    if (!confirm("🚨 CONFIRM SOS PANIC TRIGGER? This immediately broadcasts coordinates to the emergency team via secure channels.")) {
      return;
    }

    if (!navigator.geolocation) {
      showToast("Browser GPS telemetry unavailable. Please submit request manually.", 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const newRequest = {
        id: requests.length + 1,
        requestId: `SOS-${Date.now().toString().slice(-4)}`,
        resourceType: "CRITICAL SOS",
        quantityRequested: 1,
        quantityAllocated: 0,
        quantityPending: 1,
        lat,
        lng,
        severity: 5,
        individualsAffected: 1,
        status: 'pending',
        priorityScore: 150.0,
        mlPriorityClass: 'critical',
        mlConfidence: 0.99,
        contactPerson: currentUser ? currentUser.fullName : "Anonymous Civilian",
        contactPhone: "GEO-LOCATED",
        description: "🚨 SECURE SOS SIGNAL: Panic alert dispatched from mobile client. Critical response required at location."
      };

      setRequests(prev => [newRequest, ...prev]);

      // Telegram Message Dispatcher
      const botToken = "8683344314:AAETE34zer-DgxDcDqa56Vi_sJ8MQeCSRQc";
      const chatID = "7988893018";
      const msg = `🚨 *CRITICAL SOS ALERT*\n\nUser: ${newRequest.contactPerson}\nLocation: https://www.google.com/maps?q=${lat},${lng}\nStatus: IMMEDIATE RESPONSE REQUIRED`;

      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatID,
            text: msg,
            parse_mode: 'Markdown'
          })
        });
      } catch (err) {
        console.error("Telegram API connection failed:", err);
      }

      showToast("🚨 SOS EMERGENCY BROADCAST SUCCESSFUL! Operational units briefed. Stay in your current location if safe.", 'success');
    }, (error) => {
      showToast(`Location Telemetry Failed: ${error.message}`, 'error');
    });
  };

  const handleAllocateOpen = (request) => {
    setAllocateRequest(request);
    setAllocateQtyVal('');
    setShowAllocateModal(true);
  };

  const handleAllocateSubmit = (e) => {
    e.preventDefault();
    if (!allocateRequest) return;
    const qty = parseInt(allocateQtyVal);

    const resource = resources.find(r => r.type === allocateRequest.resourceType);
    if (!resource) {
      showToast("Error: Resource mapping node missing.", 'error');
      return;
    }

    if (qty > resource.availableQuantity) {
      showToast(`Insufficient supplies. Current stock: ${resource.availableQuantity}`, 'warning');
      return;
    }

    if (qty > allocateRequest.quantityPending) {
      showToast(`Allocation exceeds outstanding requests. Pending: ${allocateRequest.quantityPending}`, 'warning');
      return;
    }

    setResources(prev => prev.map(r => r.type === allocateRequest.resourceType ? { ...r, availableQuantity: r.availableQuantity - qty } : r));

    let updatedReq = null;
    setRequests(prev => prev.map(req => {
      if (req.id === allocateRequest.id) {
        const pending = req.quantityPending - qty;
        const allocated = (req.quantityAllocated || 0) + qty;
        const status = pending === 0 ? 'allocated' : 'partial';
        updatedReq = {
          ...req,
          quantityAllocated: allocated,
          quantityPending: pending,
          status
        };
        return updatedReq;
      }
      return req;
    }));

    // Update server DB persistently
    if (updatedReq) {
      fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedReq)
      }).catch(err => console.error("Error saving allocation to server:", err));
    }

    setShowAllocateModal(false);
    setAllocateRequest(null);
    showToast('Logistics allocation logged successfully.', 'success');
  };

  const handleMarkResolved = (requestId) => {
    if (confirm("Verify request resolution and close incident file?")) {
      let updatedReq = null;
      setRequests(prev => prev.map(req => {
        if (req.id === requestId) {
          updatedReq = { ...req, status: 'resolved', resolvedAt: new Date().toISOString() };
          return updatedReq;
        }
        return req;
      }));

      // Update server DB persistently
      if (updatedReq) {
        fetch('/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedReq)
        }).catch(err => console.error("Error resolving request on server:", err));
      }
    }
  };

  const handleDeleteRequest = (requestId) => {
    if (confirm("Permanently purge this resolved record from archives?")) {
      setRequests(prev => prev.filter(req => req.id !== requestId));
    }
  };

  const handleResourceOpen = (res = null) => {
    if (res) {
      setResourceModalData({
        id: res.id,
        name: res.name,
        type: res.type,
        totalQuantity: res.totalQuantity,
        availableQuantity: res.availableQuantity
      });
    } else {
      setResourceModalData({ id: '', name: '', type: '', totalQuantity: '', availableQuantity: '' });
    }
    setShowResourceModal(true);
  };

  const handleResourceSave = (e) => {
    e.preventDefault();
    const { id, name, type, totalQuantity, availableQuantity } = resourceModalData;
    const total = parseInt(totalQuantity);
    const avail = parseInt(availableQuantity);

    if (id) {
      setResources(prev => prev.map(r => r.id === id ? { ...r, name, type, totalQuantity: total, availableQuantity: avail } : r));
    } else {
      setResources(prev => [...prev, { id: prev.length + 1, name, type, totalQuantity: total, availableQuantity: avail }]);
    }
    setShowResourceModal(false);
  };

  // Helper cardinal weather converter
  const degToCardinal = (deg) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(((deg % 360) / 45)) % 8];
  };

  const getWeatherItems = (data) => {
    if (!data) return [];
    const windDirection = data.wind && data.wind.deg !== undefined
        ? `${degToCardinal(data.wind.deg)} (${data.wind.deg}° ${t.from_north})`
        : 'N/A';

    return [
      { label: t.city_name, value: data.name || 'N/A' },
      { label: t.weather_desc, value: data.weather && data.weather[0] ? data.weather[0].description : 'N/A' },
      { label: t.temp, value: data.main ? `${data.main.temp}°C` : 'N/A' },
      { label: t.feels_like, value: data.main ? `${data.main.feels_like}°C` : 'N/A' },
      { label: t.hum, value: data.main ? `${data.main.humidity}%` : 'N/A' },
      { label: t.pressure, value: data.main ? `${data.main.pressure} hPa` : 'N/A' },
      { label: t.windSpeed, value: data.wind ? `${data.wind.speed} m/s` : 'N/A' },
      { label: t.windDir, value: windDirection },
      { label: t.visibility, value: data.visibility !== undefined ? `${(data.visibility / 1000).toFixed(1)} km` : 'N/A' },
      { label: t.cloudiness, value: data.clouds ? `${data.clouds.all}%` : 'N/A' },
      { label: t.coordinates, value: data.coord ? `${data.coord.lat.toFixed(6)}, ${data.coord.lon.toFixed(6)}` : 'N/A' },
      { label: t.timezone, value: data.timezone !== undefined ? `GMT${data.timezone >= 0 ? '+' : ''}${data.timezone / 3600}` : 'N/A' },
    ];
  };


  // ML priority live display calculations
  const userPriorityResult = useMemo(() => {
    if (!userResourceType) return { priorityClass: 'low', mlConfidence: 0 };
    return calculateMLPriority(userResourceType, parseInt(userIndividuals) || 0, parseInt(userSeverity) || 0);
  }, [userResourceType, userIndividuals, userSeverity]);

  const adminPriorityResult = useMemo(() => {
    if (!adminResourceType) return { priorityClass: 'low', mlConfidence: 0 };
    return calculateMLPriority(adminResourceType, parseInt(adminIndividuals) || 0, parseInt(adminSeverity) || 0);
  }, [adminResourceType, adminIndividuals, adminSeverity]);

  // Return JSX
  return (
    <div>
      {/* 1. AUTHENTICATION COMPONENT */}
      {!currentUser && (
        <div id="authScreen" className="login-container">
          <div className="auth-wrapper">
            <div className={`auth-container ${showRegister ? 'show-register' : ''}`} id="authContainer">
              
              {/* Logo Side Panel */}
              <div className="logo-panel">
                <div className="logo-box">
                  <img src="/logo.png" alt="ResQ Link Logo" />
                  <h2>ResQ Link</h2>
                  <p>Disaster Response Management System</p>
                </div>
              </div>

              {/* Login Form Panel */}
              <div className="form-panel">
                {!showRegister ? (
                  <div className="login-card" id="loginFormCard">
                    <h1>Welcome Back</h1>
                    <p>Login to your account</p>
                    <form onSubmit={handleLoginSubmit}>
                      <div className="form-group">
                        <label htmlFor="username">{t.username}</label>
                        <input
                          type="text"
                          id="username"
                          className="form-control"
                          required
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="password">{t.password}</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="password"
                            id="password"
                            className="form-control"
                            required
                            style={{ paddingRight: '40px' }}
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                        Login
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={fillDemoCredentials}
                        style={{ width: '100%', marginTop: '8px', fontSize: '13px', borderBottomWidth: '2px' }}
                      >
                        Use Demo Admin Credentials
                      </button>
                      {authError && <div className="error-message" style={{ display: 'block' }}>{authError}</div>}
                    </form>
                    <div className="auth-link">
                      <a href="#" onClick={(e) => { e.preventDefault(); setShowRegister(true); }}>
                        Don't have an account? Create one
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="login-card" id="registerFormCard">
                    <h1>Join ResQ Link</h1>
                    <p>{t.create_account_sub}</p>
                    <form onSubmit={handleRegisterSubmit}>
                      <div className="form-section-title">Account Security</div>
                      <div className="form-group">
                        <label htmlFor="regUsername">Username *</label>
                        <input
                          type="text"
                          id="regUsername"
                          className="form-control"
                          placeholder="Choose a unique username"
                          required
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="regPassword">Password *</label>
                          <input
                            type="password"
                            id="regPassword"
                            className="form-control"
                            placeholder="Min. 6 characters"
                            required
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="regConfirmPassword">Confirm *</label>
                          <input
                            type="password"
                            id="regConfirmPassword"
                            className="form-control"
                            placeholder="Re-type password"
                            required
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-section-title" style={{ marginTop: '5px' }}>Account Type</div>
                      <div className="role-toggle">
                        <label className={`role-btn ${regRole === 'User' ? 'active' : ''}`} onClick={() => setRegRole('User')}>
                          <input type="radio" name="regRole" value="User" checked={regRole === 'User'} readOnly />
                          <i className="fa-solid fa-user role-icon"></i>
                          <span>User</span>
                          <small>Standard functionality</small>
                        </label>
                        <label className={`role-btn ${regRole === 'Admin' ? 'active' : ''}`} onClick={() => setRegRole('Admin')}>
                          <input type="radio" name="regRole" value="Admin" checked={regRole === 'Admin'} readOnly />
                          <i className="fa-solid fa-user-gear role-icon"></i>
                          <span>Admin</span>
                          <small>System management</small>
                        </label>
                      </div>

                      {regError && <div className="error-message" style={{ display: 'block' }}>{regError}</div>}
                      
                      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                        Create Account
                      </button>
                    </form>
                    <div className="auth-link">
                      <a href="#" onClick={(e) => { e.preventDefault(); setShowRegister(false); }}>
                        Already have an account? Login
                      </a>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 2. ADMIN DASHBOARD */}
      {currentUser && currentUser.role === 'Admin' && (
        <div id="adminDashboard" className="dashboard" style={{ display: 'block' }}>
          
          {/* Header Panel */}
          <div className="header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <img src="/logo.png" alt="ResQ Link Logo" style={{ height: '80px', width: 'auto', borderRadius: '50%' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 style={{ margin: 0, fontSize: '48px', letterSpacing: '1px', lineHeight: '1.2' }}>{t.title}</h1>
                <span style={{ fontSize: '20px', opacity: 0.9, fontWeight: 'normal' }}>{t.base}</span>
              </div>
            </div>
            <div className="header-right">
              <button
                className="btn btn-secondary btn-small"
                id="tacticalToggleAdmin"
                onClick={() => setTacticalMode(prev => !prev)}
                style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: tacticalMode ? '#900' : '#333', color: tacticalMode ? '#fff' : '#00ff88', border: '1px solid #444' }}
              >
                <i className={tacticalMode ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                <span>{tacticalMode ? t.normal_mode : t.tactical_mode}</span>
              </button>
              <button
                className="btn btn-secondary btn-small"
                id="langToggleAdmin"
                onClick={() => setLang(prev => prev === 'en' ? 'kn' : 'en')}
                style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <i className="fas fa-language"></i>
                <span>{lang === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
              </button>
              <div className="user-info">
                <span id="userRole" style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{t.admin}</span>
              </div>
              <button className="btn btn-logout btn-small" onClick={handleLogout}>{t.logout}</button>
            </div>
          </div>

          <div className="container">
            
            {/* Top Stat Cards */}
            <div className="stats-grid" id="adminStatsGrid" style={{ display: 'grid', marginBottom: '24px' }}>
              <div className="stat-card">
                <div className="icon-container"><i className="fas fa-clipboard-list"></i></div>
                <div className="stat-content">
                  <h3>{t.total_req}</h3>
                  <div className="value">{requests.length}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="icon-container"><i className="fas fa-hourglass-half"></i></div>
                <div className="stat-content">
                  <h3>{t.active_req_short}</h3>
                  <div className="value">{requests.filter(r => r.status !== 'resolved').length}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="icon-container"><i className="fas fa-check-circle"></i></div>
                <div className="stat-content">
                  <h3>{t.resolved_req_short}</h3>
                  <div className="value">{requests.filter(r => r.status === 'resolved').length}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="icon-container"><i className="fas fa-exclamation-triangle"></i></div>
                <div className="stat-content">
                  <h3>{t.critical_priority}</h3>
                  <div className="value">{requests.filter(r => r.mlPriorityClass === 'critical' && r.status !== 'resolved').length}</div>
                </div>
              </div>
            </div>

            {/* AI Assistant situational brief */}
            <div id="aiAssistantSection" className="weather-section" style={{ marginBottom: '24px', border: '2px solid var(--color-primary)', display: 'block' }}>
              <div className="weather-header" style={{ background: 'linear-gradient(90deg, var(--color-darkest) 0%, var(--color-primary) 100%)', color: 'white' }}>
                <h2 style={{ color: 'white' }}><i className="fas fa-robot"></i> {t.ai_assistant}</h2>
                <button className="btn btn-secondary btn-small" onClick={getAISummary} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }} disabled={isAiLoading}>
                  <i className="fas fa-sync-alt"></i> {isAiLoading ? t.analyzing_data : t.gen_report}
                </button>
              </div>
              <div style={{ padding: '20px', background: 'rgba(0,0,0,0.02)' }}>
                <div id="aiSummaryOutput" style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--color-text)', fontWeight: '500', opacity: isAiLoading ? 0.5 : 1 }}>
                  {aiSummaryOutput || t.ai_helper_text}
                </div>
                {isAiLoading && (
                  <div id="aiLoader" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-primary)', marginTop: '10px' }}>
                    <i className="fas fa-circle-notch fa-spin"></i> {t.analyzing_data}
                  </div>
                )}
              </div>
            </div>

            {/* Collapsible telemetry grids */}
            <div className="collapsible-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
              
              {/* Sensor Card */}
              <div id="hardwareSection" className="weather-section" style={{ display: 'block' }}>
                <div className="weather-header" onClick={() => setIsHardwareExpanded(prev => !prev)}>
                  <h2><i className="fas fa-microchip"></i> {t.hw_title}</h2>
                  <i className="fas fa-chevron-down" style={{ transform: isHardwareExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}></i>
                </div>
                <div className={`weather-content ${isHardwareExpanded ? 'expanded' : ''}`}>
                  <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                    <div className="stat-card hw-card" id="hwCardTemp"><div className="stat-content"><h3>{t.temp}</h3><div className="value">{sensorData.temperature}°C</div></div></div>
                    <div className="stat-card hw-card" id="hwCardHum"><div className="stat-content"><h3>{t.hum}</h3><div className="value">{sensorData.humidity}%</div></div></div>
                    <div className="stat-card hw-card" id="hwCardSeismic"><div className="stat-content"><h3>{t.seismic}</h3><div className="value">{sensorData.seismic} m/s²</div></div></div>
                    <div className="stat-card hw-card" id="hwCardWater"><div className="stat-content"><h3>{t.water}</h3><div className="value">{sensorData.water_level}</div></div></div>
                    <div className="stat-card hw-card" id="hwCardSoil"><div className="stat-content"><h3>{t.soil}</h3><div className="value">{sensorData.soil_moisture}</div></div></div>
                    <div className="stat-card hw-card" id="hwCardRain"><div className="stat-content"><h3>{t.rain}</h3><div className="value">{sensorData.rain_level}</div></div></div>
                    <div className="stat-card hw-card" id="hwCardAltitude"><div className="stat-content"><h3>{t.altitude}</h3><div className="value">{sensorData.altitude} m</div></div></div>
                  </div>
                  <div style={{ padding: '0 15px 15px', fontSize: '10px', color: '#666', textAlign: 'right' }}>
                    {t.last_sync || 'Last Sync'}: {new Date(sensorData.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Weather Card */}
              <div id="weatherSection" className="weather-section" style={{ display: 'block' }}>
                <div className="weather-header" onClick={() => setIsWeatherExpanded(prev => !prev)}>
                  <h2><i className="fas fa-cloud-sun"></i> {t.weather_forecast}</h2>
                  <i className="fas fa-chevron-down" style={{ transform: isWeatherExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}></i>
                </div>
                <div className={`weather-content ${isWeatherExpanded ? 'expanded' : ''}`}>
                  {weatherData ? (
                    <div className="weather-grid" style={{ padding: '15px' }}>
                      {getWeatherItems(weatherData).map((item, idx) => (
                        <div className="weather-item" key={idx}>
                          <label>{item.label}</label>
                          <div className="value">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-secondary)' }}>
                      {t.loading_weather}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Map Workstation Section */}
            <div className="section" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ margin: 0 }}><i className="fas fa-map-location-dot"></i> {t.command_map}</h2>
                <span className="status-badge status-pending">{t.live_deployment}</span>
              </div>
              <div style={{ height: '500px', width: '100%', border: '1px solid #ddd', overflow: 'hidden', borderRadius: '12px' }}>
                <MapComponent
                  lat={currentBaseLocation.lat}
                  lng={currentBaseLocation.lng}
                  name={currentBaseLocation.name}
                  requests={requests}
                  volunteers={volunteers}
                  onMapClick={handleMapClick}
                  selectedLocation={selectedLocation}
                  routeCoordinates={routeCoordinates}
                  tacticalMode={tacticalMode}
                />
              </div>
            </div>

            {/* Admin Input Panel and Requests table layout */}
            <div className="main-workspace">
              {/* Active Requests */}
              <div className="section" id="activeRequestsSection" style={{ height: 'auto', display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h2>{t.active_req}</h2>
                  <select id="riskSort" className="form-control" style={{ width: 'auto' }} value={riskSort} onChange={(e) => setRiskSort(e.target.value)}>
                    <option value="critical">{t.critical_first}</option>
                    <option value="low">{t.low_first}</option>
                  </select>
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr><th>{t.type}</th><th>{t.qty_short}</th><th>{t.location}</th><th>{t.person}</th><th>{t.phone_short}</th><th>{t.priority}</th><th>{t.status}</th><th>{t.actions}</th></tr>
                    </thead>
                    <tbody id="activeRequestsTable">
                      {sortedRequests.active.map(req => (
                        <tr key={req.id || req.requestId}>
                          <td>{req.resourceType}</td>
                          <td>{req.quantityAllocated || 0}/{req.quantityRequested}</td>
                          <td style={{ fontSize: '13px', maxWidth: '150px' }}>{req.address || `Lat: ${req.lat.toFixed(4)}, Lng: ${req.lng.toFixed(4)}`}</td>
                          <td>{req.contactPerson || 'N/A'}</td>
                          <td className="contact-phone">{req.contactPhone || 'N/A'}</td>
                          <td><span className={`priority-badge priority-${req.mlPriorityClass}`}>{req.mlPriorityClass.toUpperCase()}</span></td>
                          <td><span className={`status-badge status-${req.status}`}>{req.status.toUpperCase()}</span></td>
                          <td>
                            <div className="btn-group">
                              <button className="btn btn-secondary btn-small" onClick={() => handleShowRoute(req)}>{t.route}</button>
                              {req.status !== 'allocated' && <button className="btn btn-primary btn-small" onClick={() => handleAllocateOpen(req)}>{t.allocate}</button>}
                              {req.status === 'allocated' && <button className="btn btn-primary btn-small" onClick={() => handleMarkResolved(req.id)}>{t.resolve}</button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submit Emergency Request Form (Admin Side) */}
              <div className="form-section" style={{ height: 'auto' }}>
                <h2>{t.submit_req_admin}</h2>
                <div className="priority-display" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gridTemplateRows: 'auto auto', gap: '0px', alignItems: 'center' }}>
                  <h3>{t.ml_priority}</h3>
                  <div className="confidence">{t.confidence}: {adminPriorityResult.mlConfidence}%</div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                    <div className={`priority-badge priority-${adminPriorityResult.priorityClass}`}>{adminPriorityResult.priorityClass.toUpperCase()}</div>
                  </div>
                </div>

                <form onSubmit={handleAdminRequestSubmit}>
                  <div className="form-group">
                    <label style={{ fontSize: '16px' }}>{t.res_type}</label>
                    <select className="form-control" style={{ height: '50px', fontSize: '15px' }} required value={adminResourceType} onChange={(e) => setAdminResourceType(e.target.value)}>
                      <option value="">{t.select_resource}</option>
                      <option value="Medical Supplies">Medical Supplies</option>
                      <option value="Food & Water">Food &amp; Water</option>
                      <option value="Shelter">Shelter</option>
                      <option value="Rescue Team">Rescue Team</option>
                      <option value="Ambulance">Ambulance</option>
                      <option value="Bedding">Bedding</option>
                      <option value="Rescue Boats">Rescue Boats</option>
                      <option value="Heavy Machinery">Heavy Machinery</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>{t.qty}</label>
                      <input type="number" className="form-control" required min="1" value={adminQuantity} onChange={(e) => setAdminQuantity(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>{t.severity}</label>
                      <input type="number" className="form-control" required min="1" max="5" value={adminSeverity} onChange={(e) => setAdminSeverity(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t.affected}</label>
                    <input type="number" className="form-control" required min="1" value={adminIndividuals} onChange={(e) => setAdminIndividuals(e.target.value)} />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>{t.person}</label>
                      <input type="text" className="form-control" required value={adminContact} onChange={(e) => setAdminContact(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>{t.phone}</label>
                      <input type="text" className="form-control" required value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t.desc}</label>
                    <textarea className="form-control" rows="3" required value={adminDescription} onChange={(e) => setAdminDescription(e.target.value)}></textarea>
                  </div>

                  <div style={{ fontSize: '12px', margin: '5px 0 10px', color: '#666' }}>
                    {selectedLocation ? `${t.pinned_target}: ${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}` : t.map_pin_required}
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ height: '60px', fontSize: '18px', fontWeight: 'bold' }}>
                    {t.submit_btn}
                  </button>
                </form>
              </div>
            </div>

            {/* Volunteer Dispatch Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '24px', marginTop: '24px' }}>
              <div className="section" id="volunteerManagementSection">
                <h2>{t.on_duty_vols}</h2>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr><th>{t.name}</th><th>{t.role}</th><th>{t.status}</th><th>{t.phone}</th><th>{t.actions}</th></tr>
                    </thead>
                    <tbody id="volunteerTable">
                      {volunteers.map(v => (
                        <tr key={v.id}>
                          <td><strong>{v.name}</strong></td>
                          <td>{v.role}</td>
                          <td><span className={`status-badge status-${v.status}`}>{v.status.toUpperCase()}</span></td>
                          <td>{v.phone}</td>
                          <td>
                            <button className="btn btn-primary btn-small" onClick={() => handleDispatchVolunteer(v.id)} disabled={v.status === 'busy'}>
                              Dispatch
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resource Management Side card */}
              <div className="section" id="resourcesSection">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0 }}>Available Resources</h2>
                  <button className="btn btn-primary btn-small" style={{ display: 'block' }} onClick={() => handleResourceOpen()}>{t.add_resource}</button>
                </div>
                <div className="resources-grid" id="resourcesGrid">
                  {resources.map(res => {
                    const pct = ((res.availableQuantity / res.totalQuantity) * 100).toFixed(0);
                    return (
                      <div className="resource-card" key={res.id} onClick={() => handleResourceOpen(res)} style={{ cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '8px' }}>
                          <span>{res.name}</span>
                          <span style={{ color: 'var(--color-primary)' }}>{res.availableQuantity}/{res.totalQuantity}</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress" style={{ width: `${pct}%`, background: pct < 20 ? '#ef4444' : (pct < 50 ? '#f97316' : '#10b981') }}></div>
                        </div>
                        <div style={{ fontSize: '11px', marginTop: '5px', color: '#666', textAlign: 'right' }}>
                          {t.type}: {res.type}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Inventory Exhaustion Forecast and analytics */}
            <div className="section" id="analyticsSection" style={{ display: 'block' }}>
              <h2>{t.sys_analytics}</h2>
              <div className="ai-demand-section" style={{ marginBottom: '20px' }}>
                <div className="ai-demand-header">
                  <h3><i className="fas fa-hourglass-half"></i> {t.exhaustion_forecast}</h3>
                </div>
                <div className="ai-demand-grid" id="forecastingGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  {forecasts.map(f => (
                    <div className={`ai-demand-card forecast-${f.riskStatus}`} key={f.id} style={{
                      padding: '15px',
                      borderRadius: '12px',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderLeft: `5px solid ${f.riskStatus === 'critical' ? '#ff4444' : (f.riskStatus === 'high' ? '#ff8800' : '#22c55e')}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '120px'
                    }}>
                      <div style={{ fontWeight: '700', marginBottom: '5px' }}><i className="fas fa-hourglass-half"></i> {f.name}</div>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-primary)' }}>{f.hoursLeft} <span style={{ fontSize: '14px' }}>{t.hrs_left}</span></div>
                      <div style={{ fontSize: '12px', marginTop: '5px' }}>
                        {t.burn_rate}: ~{f.hourlyRate} {t.units_hr}<br />
                        <span className={`status-badge status-${f.riskStatus}`}>{f.riskStatus.toUpperCase()} {t.risk}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="analytics-grid">
                <div className="analytics-card"><h3>{t.avg_priority}</h3><div className="value" id="avgPriority">{avgPriority}</div></div>
                <div className="analytics-card"><h3>{t.people_helped}</h3><div className="value" id="totalIndividuals">{peopleHelped}</div></div>
                <div className="analytics-card"><h3>{t.utilization}</h3><div className="value" id="resourceUtilization">{resourceUtilization}%</div></div>
                <div className="analytics-card"><h3>{t.avg_response_time}</h3><div className="value" id="avgResponseTime">N/A</div></div>
              </div>
            </div>

            {/* Resolved requests */}
            <div className="section" id="resolvedRequestsSection" style={{ opacity: 0.8, display: 'block' }}>
              <h2>{t.resolved_history}</h2>
              <div className="table-container">
                <table style={{ fontSize: '13px' }}>
                  <thead>
                    <tr><th>{t.id}</th><th>{t.type}</th><th>{t.location}</th><th>{t.person}</th><th>{t.phone_short}</th><th>{t.desc}</th><th>{t.priority}</th><th>{t.resolved_at}</th><th>{t.actions}</th></tr>
                  </thead>
                  <tbody>
                    {sortedRequests.resolved.map(req => (
                      <tr key={req.id || req.requestId}>
                        <td><strong>{req.requestId}</strong></td>
                        <td>{req.resourceType}</td>
                        <td style={{ fontSize: '12px', maxWidth: '150px' }}>{req.address || `Lat: ${req.lat.toFixed(4)}, Lng: ${req.lng.toFixed(4)}`}</td>
                        <td>{req.contactPerson || 'N/A'}</td>
                        <td>{req.contactPhone || 'N/A'}</td>
                        <td style={{ fontSize: '12px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={req.description}>
                          {req.description}
                        </td>
                        <td><span className={`priority-badge priority-${req.mlPriorityClass}`}>{req.mlPriorityClass.toUpperCase()}</span></td>
                        <td>{new Date(req.resolvedAt).toLocaleString()}</td>
                        <td>
                          <div className="btn-group">
                            <button className="btn btn-secondary btn-small" onClick={() => handleDeleteRequest(req.id)}>{t.purge}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. USER DASHBOARD */}
      {currentUser && currentUser.role === 'User' && (
        <div id="userDashboard" className="dashboard" style={{ display: 'block' }}>
          
          {/* Header */}
          <div className="header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <img src="/logo.png" alt="ResQ Link Logo" style={{ height: '80px', width: 'auto', borderRadius: '50%' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 style={{ margin: 0, fontSize: '48px', letterSpacing: '1px', lineHeight: '1.2' }}>{t.title}</h1>
                <span style={{ fontSize: '20px', opacity: 0.9, fontWeight: 'normal' }}>{t.base}</span>
              </div>
            </div>
            <div className="header-right">
              <button
                className="btn btn-secondary btn-small"
                id="tacticalToggleUser"
                onClick={() => setTacticalMode(prev => !prev)}
                style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: tacticalMode ? '#900' : '#333', color: tacticalMode ? '#fff' : '#ff0000', border: '1px solid #444' }}
              >
                <i className={tacticalMode ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                <span>{tacticalMode ? 'Normal Mode' : 'Tactical Mode'}</span>
              </button>
              <button
                className="btn btn-secondary btn-small"
                id="langToggleUser"
                onClick={() => setLang(prev => prev === 'en' ? 'kn' : 'en')}
                style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <i className="fas fa-language"></i>
                <span>{lang === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
              </button>
              <button
                className="btn btn-secondary btn-small"
                id="mobileViewToggle"
                onClick={() => setMobileView(prev => !prev)}
                style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className={mobileView ? "fas fa-desktop" : "fas fa-mobile-alt"}></i>
              </button>
              <div className="user-info">
                <span id="userDashboardRole">{currentUser.fullName}</span>
              </div>
              <button className="btn btn-logout btn-small" onClick={handleLogout}>{t.logout}</button>
            </div>
          </div>

          <div className="container">
            <div className="main-workspace" style={{ marginBottom: '24px' }}>
              
              {/* User map coordinate picker */}
              <div className="map-section">
                <h2><i className="fas fa-map-marked-alt"></i> {t.location_map}</h2>
                <div style={{ height: '500px', width: '100%', border: '1px solid #ddd', borderRadius: '12px', overflow: 'hidden' }}>
                  <MapComponent
                    lat={currentBaseLocation.lat}
                    lng={currentBaseLocation.lng}
                    name={currentBaseLocation.name}
                    requests={requests}
                    volunteers={volunteers}
                    onMapClick={handleMapClick}
                    selectedLocation={selectedLocation}
                    routeCoordinates={routeCoordinates}
                    tacticalMode={tacticalMode}
                  />
                </div>
              </div>

              {/* User input emergency trigger panel */}
              <div className="form-section">
                
                {/* Panic SOS Button */}
                <div className="sos-container">
                  <button className="btn-sos" onClick={handleSOSPanic}>
                    <i className="fas fa-hand-holding-medical"></i>
                    <span>{t.sos_btn}</span>
                  </button>
                  <div className="sos-label">{t.sos_label}</div>
                  <div className="sos-hint">{t.sos_hint}</div>
                </div>

                <h2>{t.submit_req}</h2>
                
                {/* Dynamic ML Score Box */}
                <div className="priority-display" id="userPriorityDisplay" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gridTemplateRows: 'auto auto', gap: '0px', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>Real-time ML Priority</h3>
                  <div className="confidence" id="userPriorityConfidence">{t.confidence}: {userPriorityResult.mlConfidence}%</div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                    <div className={`priority-badge priority-${userPriorityResult.priorityClass}`} id="userPriorityBadge">
                      {userPriorityResult.priorityClass.toUpperCase()}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleUserRequestSubmit}>
                  <div className="form-group">
                    <label htmlFor="userResourceType" style={{ fontSize: '16px' }}>{t.res_type}</label>
                    <select id="userResourceType" className="form-control" required style={{ height: '50px', fontSize: '15px' }} value={userResourceType} onChange={(e) => setUserResourceType(e.target.value)}>
                      <option value="">Select Resource</option>
                      <option value="Medical Supplies">Medical Supplies</option>
                      <option value="Food & Water">Food &amp; Water</option>
                      <option value="Shelter">Shelter</option>
                      <option value="Rescue Team">Rescue Team</option>
                      <option value="Ambulance">Ambulance</option>
                      <option value="Bedding">Bedding</option>
                      <option value="Rescue Boats">Rescue Boats</option>
                      <option value="Heavy Machinery">Heavy Machinery</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="userQuantity">{t.qty}</label>
                      <input type="number" id="userQuantity" className="form-control" required min="1" value={userQuantity} onChange={(e) => setUserQuantity(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="userSeverity">{t.severity}</label>
                      <input type="number" id="userSeverity" className="form-control" required min="1" max="5" value={userSeverity} onChange={(e) => setUserSeverity(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="userIndividualsAffected">{t.affected}</label>
                    <input type="number" id="userIndividualsAffected" className="form-control" required min="1" value={userIndividuals} onChange={(e) => setUserIndividuals(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label htmlFor="userDescription">{t.desc}</label>
                    <textarea id="userDescription" className="form-control" rows="3" required value={userDescription} onChange={(e) => setUserDescription(e.target.value)}></textarea>
                  </div>

                  <div style={{ fontSize: '12px', margin: '5px 0 10px', color: '#666' }}>
                    {selectedLocation ? `${t.coords_locked}: ${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}` : t.pin_target_required}
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ height: '60px', fontSize: '18px', fontWeight: 'bold' }}>
                    {t.submit_btn}
                  </button>
                </form>

              </div>
            </div>

            {/* Weather / Sensors / Volunteers Accordions */}
            <div className="sections-grid" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Weather info */}
              <div className="weather-section" id="userWeatherSection">
                <div className="weather-header" onClick={() => setIsWeatherExpanded(prev => !prev)}>
                  <h2><i className="fas fa-cloud-sun"></i> {t.local_weather}</h2>
                  <i className="fas fa-chevron-down" style={{ transform: isWeatherExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}></i>
                </div>
                <div className={`weather-content ${isWeatherExpanded ? 'expanded' : ''}`}>
                  {weatherData ? (
                    <div className="weather-grid" style={{ padding: '15px' }}>
                      {getWeatherItems(weatherData).map((item, idx) => (
                        <div className="weather-item" key={idx}>
                          <label>{item.label}</label>
                          <div className="value">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '15px', color: '#666' }}>{t.weather_syncing}</div>
                  )}
                </div>
              </div>

              {/* Hardware Sensors */}
              <div className="weather-section" id="userHardwareSection">
                <div className="weather-header" onClick={() => setIsHardwareExpanded(prev => !prev)}>
                  <h2><i className="fas fa-microchip"></i> {t.live_sensor_data}</h2>
                  <i className="fas fa-chevron-down" style={{ transform: isHardwareExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}></i>
                </div>
                <div className={`weather-content ${isHardwareExpanded ? 'expanded' : ''}`}>
                  <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                    <div className="hw-item" style={{ padding: '10px', background: '#fff', borderRadius: '8px' }}>
                      <label style={{ fontSize: '11px' }}>{t.temp}</label>
                      <div style={{ fontWeight: 'bold' }}>{sensorData.temperature}°C</div>
                    </div>
                    <div className="hw-item" style={{ padding: '10px', background: '#fff', borderRadius: '8px' }}>
                      <label style={{ fontSize: '11px' }}>{t.hum}</label>
                      <div style={{ fontWeight: 'bold' }}>{sensorData.humidity}%</div>
                    </div>
                    <div className="hw-item" style={{ padding: '10px', background: '#fff', borderRadius: '8px' }}>
                      <label style={{ fontSize: '11px' }}>{t.seismic}</label>
                      <div style={{ fontWeight: 'bold' }}>{sensorData.seismic} m/s²</div>
                    </div>
                    <div className="hw-item" style={{ padding: '10px', background: '#fff', borderRadius: '8px' }}>
                      <label style={{ fontSize: '11px' }}>{t.water}</label>
                      <div style={{ fontWeight: 'bold' }}>{sensorData.water_level}</div>
                    </div>
                    <div className="hw-item" style={{ padding: '10px', background: '#fff', borderRadius: '8px' }}>
                      <label style={{ fontSize: '11px' }}>{t.soil}</label>
                      <div style={{ fontWeight: 'bold' }}>{sensorData.soil_moisture}</div>
                    </div>
                    <div className="hw-item" style={{ padding: '10px', background: '#fff', borderRadius: '8px' }}>
                      <label style={{ fontSize: '11px' }}>{t.rain}</label>
                      <div style={{ fontWeight: 'bold' }}>{sensorData.rain_level}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Volunteer Register */}
              <div className="weather-section" id="volunteerSection">
                <div className="weather-header" onClick={() => setIsVolunteerFormExpanded(prev => !prev)}>
                  <h2><i className="fas fa-user-plus"></i> {t.join_vol}</h2>
                  <i className="fas fa-chevron-down" style={{ transform: isVolunteerFormExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}></i>
                </div>
                <div className={`weather-content ${isVolunteerFormExpanded ? 'expanded' : ''}`}>
                  <div style={{ padding: '20px' }}>
                    <form onSubmit={handleVolunteerRegister}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>{t.name}</label>
                          <input type="text" className="form-control" required value={volName} onChange={(e) => setVolName(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>{t.expertise}</label>
                          <select className="form-control" required value={volRole} onChange={(e) => setVolRole(e.target.value)}>
                            <option value="Medical">Medical / First Aid</option>
                            <option value="Rescue">Rescue / Search</option>
                            <option value="Driver">Driver / Logistics</option>
                            <option value="General">General Assistance</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>{t.phone}</label>
                        <input type="tel" className="form-control" required value={volPhone} onChange={(e) => setVolPhone(e.target.value)} />
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>{t.reg_vol}</button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Supplies List */}
              <div className="weather-section" id="userResourcesSection">
                <div className="weather-header" onClick={() => setIsUserResourcesExpanded(prev => !prev)}>
                  <h2><i className="fas fa-boxes"></i> {t.avail_supplies}</h2>
                  <i className="fas fa-chevron-down" style={{ transform: isUserResourcesExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}></i>
                </div>
                <div className={`weather-content ${isUserResourcesExpanded ? 'expanded' : ''}`}>
                  <div style={{ padding: '20px' }}>
                    <div className="resources-grid">
                      {resources.map(res => {
                        const pct = ((res.availableQuantity / res.totalQuantity) * 100).toFixed(0);
                        return (
                          <div className="resource-card" key={res.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '8px' }}>
                              <span>{res.name}</span>
                              <span style={{ color: 'var(--color-primary)' }}>{res.availableQuantity}/{res.totalQuantity}</span>
                            </div>
                            <div className="progress-bar">
                              <div className="progress" style={{ width: `${pct}%`, background: pct < 20 ? '#ef4444' : (pct < 50 ? '#f97316' : '#10b981') }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 4. MODALS & DIALOGS */}
      {/* Allocate Supplies Modal */}
      {showAllocateModal && allocateRequest && (
        <div id="allocateModal" className="modal" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{t.allocate_resources}</h2>
              <button className="btn-close" onClick={() => { setShowAllocateModal(false); setAllocateRequest(null); }}>&times;</button>
            </div>
            <div style={{ background: 'var(--color-surface)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Request Details
              </h3>
              <div className="info-item"><span className="info-label">Request ID:</span><span className="info-value">{allocateRequest.requestId}</span></div>
              <div className="info-item"><span className="info-label">Resource Type:</span><span className="info-value">{allocateRequest.resourceType}</span></div>
              <div className="info-item"><span className="info-label">Quantity Requested:</span><span className="info-value">{allocateRequest.quantityRequested}</span></div>
              <div className="info-item"><span className="info-label">Contact Person:</span><span className="info-value">{allocateRequest.contactPerson}</span></div>
              <div className="info-item"><span className="info-label">Contact Phone:</span><span className="info-value" style={{ color: '#2563eb' }}>{allocateRequest.contactPhone}</span></div>
              <div className="info-item"><span className="info-label">Location:</span><span className="info-value">{`Lat: ${allocateRequest.lat.toFixed(5)}, Lng: ${allocateRequest.lng.toFixed(5)}`}</span></div>
              <div className="info-item"><span className="info-label">Individuals Affected:</span><span className="info-value">{allocateRequest.individualsAffected}</span></div>
              <div className="info-item"><span className="info-label">Severity:</span><span className="info-value">{allocateRequest.severity}</span></div>
              <div className="info-item"><span className="info-label">Priority:</span><span className="info-value">{allocateRequest.mlPriorityClass.toUpperCase()}</span></div>
              <div className="info-item" style={{ borderBottom: 'none' }}><span className="info-label">Description:</span></div>
              <p className="description-text" style={{ marginTop: '8px' }}>{allocateRequest.description || 'N/A'}</p>
            </div>
            <form onSubmit={handleAllocateSubmit}>
              <div className="form-group">
                <label>{t.qty_to_allocate}</label>
                <input
                  type="number"
                  className="form-control"
                  required
                  min="1"
                  max={allocateRequest.quantityPending}
                  value={allocateQtyVal}
                  onChange={(e) => setAllocateQtyVal(e.target.value)}
                />
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-primary">Allocate</button>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAllocateModal(false); setAllocateRequest(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OSRM Route Info Modal */}
      {showRouteModal && routeData && (
        <div id="routeModal" className="modal" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>Route Information</h2>
              <button className="btn-close" onClick={() => setShowRouteModal(false)}>&times;</button>
            </div>
            <div className="route-info-grid">
              <div className="info-section">
                <h3>Route Details</h3>
                <div className="info-item"><span className="info-label">Distance:</span><span className="info-value">{routeData.distance} km</span></div>
                <div className="info-item"><span className="info-label">Estimated Time:</span><span className="info-value">{routeData.duration} minutes</span></div>
              </div>
              <div className="info-section">
                <h3>Emergency Details</h3>
                <div className="info-item"><span className="info-label">Location:</span><span className="info-value">{routeData.location}</span></div>
                <div className="info-item"><span className="info-label">Contact Person:</span><span className="info-value">{routeData.contactPerson}</span></div>
                <div className="info-item"><span className="info-label">Contact Phone:</span><span className="info-value" style={{ color: '#2563eb' }}>{routeData.contactPhone}</span></div>
                <div className="info-item"><span className="info-label">Individuals Affected:</span><span className="info-value">{routeData.individualsAffected}</span></div>
                <div className="info-item"><span className="info-label">Severity Level:</span><span className="info-value">{routeData.severity}</span></div>
              </div>
              <div className="info-section full-width">
                <h3>Description</h3>
                <p className="description-text">{routeData.description || 'N/A'}</p>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => setShowRouteModal(false)}>OK</button>
          </div>
        </div>
      )}

      {/* Add / Edit Resource Modal */}
      {showResourceModal && (
        <div id="resourceModal" className="modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>{resourceModalData.id ? t.edit_resource : t.add_resource}</h2>
              <button className="btn-close" onClick={() => setShowResourceModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleResourceSave}>
              <div className="form-group">
                <label htmlFor="resourceName">Resource Name</label>
                <input
                  type="text"
                  id="resourceName"
                  className="form-control"
                  required
                  value={resourceModalData.name}
                  onChange={(e) => setResourceModalData({ ...resourceModalData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="resourceTypeSelect">Resource Type</label>
                <select
                  id="resourceTypeSelect"
                  className="form-control"
                  required
                  value={resourceModalData.type}
                  onChange={(e) => setResourceModalData({ ...resourceModalData, type: e.target.value })}
                >
                  <option value="" disabled>Select Resource</option>
                  <option value="Medical Supplies">Medical Supplies</option>
                  <option value="Food & Water">Food &amp; Water</option>
                  <option value="Shelter">Shelter</option>
                  <option value="Rescue Team">Rescue Team</option>
                  <option value="Ambulance">Ambulance</option>
                  <option value="Bedding">Bedding</option>
                  <option value="Rescue Boats">Rescue Boats</option>
                  <option value="Heavy Machinery">Heavy Machinery</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="resourceTotal">Total Quantity</label>
                <input
                  type="number"
                  id="resourceTotal"
                  className="form-control"
                  required
                  min="1"
                  value={resourceModalData.totalQuantity}
                  onChange={(e) => setResourceModalData({ ...resourceModalData, totalQuantity: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="resourceAvailable">Available Quantity</label>
                <input
                  type="number"
                  id="resourceAvailable"
                  className="form-control"
                  required
                  min="0"
                  value={resourceModalData.availableQuantity}
                  onChange={(e) => setResourceModalData({ ...resourceModalData, availableQuantity: e.target.value })}
                />
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowResourceModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast.visible && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: toast.type === 'success' ? '#22c55e' : (toast.type === 'error' ? '#ef4444' : (toast.type === 'warning' ? '#f59e0b' : '#3b82f6')),
          color: '#fff',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: '600',
          transition: 'all 0.3s ease',
          fontSize: '14px',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <i className={toast.type === 'success' ? 'fas fa-check-circle' : (toast.type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-exclamation-triangle')}></i>
          <span>{toast.message}</span>
          <button onClick={() => setToast(prev => ({ ...prev, visible: false }))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: '10px', fontSize: '18px', fontWeight: 'bold', lineHeight: '1' }}>×</button>
        </div>
      )}

    </div>
  );
}
