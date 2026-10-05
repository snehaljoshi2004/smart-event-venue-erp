\# API Documentation



Base URL:



http://localhost:5000



\## Authentication



Protected endpoints require:



Authorization: Bearer <JWT\_TOKEN>



\---



\# 1. Health Check



\## GET /api/health



No authentication required.



\### Response



{

&#x20; "success": true,

&#x20; "message": "Event ERP API is running"

}



\---



\# 2. Login



\## POST /api/auth/login



No authentication required.



\### Request



{

&#x20; "email": "admin@eventerp.com",

&#x20; "password": "Admin@123"

}



\### Response



{

&#x20; "success": true,

&#x20; "message": "Login successful",

&#x20; "data": {

&#x20;   "token": "<JWT\_TOKEN>",

&#x20;   "user": {

&#x20;     "id": 1,

&#x20;     "name": "Admin User",

&#x20;     "email": "admin@eventerp.com",

&#x20;     "role": "admin"

&#x20;   }

&#x20; }

}



\---



\# 3. Create Event



\## POST /api/events



Authentication required.



Roles:



\- admin

\- staff



\### Request



{

&#x20; "customerId": 1,

&#x20; "hallId": 1,

&#x20; "title": "Rahul Wedding",

&#x20; "startAt": "2026-10-10T10:00:00",

&#x20; "endAt": "2026-10-10T14:00:00",

&#x20; "guestCount": 300,

&#x20; "services": \[

&#x20;   {

&#x20;     "serviceId": 4,

&#x20;     "quantity": 1

&#x20;   }

&#x20; ],

&#x20; "staff": \[

&#x20;   {

&#x20;     "staffId": 1

&#x20;   }

&#x20; ],

&#x20; "equipment": \[

&#x20;   {

&#x20;     "equipmentId": 1,

&#x20;     "quantity": 2

&#x20;   }

&#x20; ]

}



\### Response



{

&#x20; "success": true,

&#x20; "message": "Event created successfully",

&#x20; "data": {

&#x20;   "id": 1,

&#x20;   "status": "PLANNED",

&#x20;   "totalAmount": 12000

&#x20; }

}



The event total is calculated server-side using the configured service prices.



\---



\# 4. List Events



\## GET /api/events



Authentication required.



Roles:



\- admin

\- staff



\### Optional Filters



GET /api/events?status=CONFIRMED



GET /api/events?customerId=1



\### Response



{

&#x20; "success": true,

&#x20; "data": \[

&#x20;   {

&#x20;     "id": 1,

&#x20;     "title": "Rahul Wedding",

&#x20;     "status": "CONFIRMED",

&#x20;     "customer\_name": "Rahul Sharma",

&#x20;     "hall\_name": "Main Hall"

&#x20;   }

&#x20; ]

}



\---



\# 5. Confirm Event



\## POST /api/events/:id/confirm



Authentication required.



Role:



\- admin



Example:



POST /api/events/1/confirm



\### Business Checks



Before confirmation the system checks:



\- Event must be in PLANNED status.

\- Hall must not have an overlapping confirmed/in-progress event.

\- Assigned staff must not have overlapping confirmed/in-progress events.

\- Equipment quantity must be available.

\- Event service prices are recalculated server-side.



\### Success Response



{

&#x20; "success": true,

&#x20; "message": "Event confirmed successfully",

&#x20; "data": {

&#x20;   "id": 1,

&#x20;   "status": "CONFIRMED"

&#x20; }

}



\---



\# 6. Update Event Status



\## PATCH /api/events/:id/status



Authentication required.



Roles:



\- admin

\- staff



\### Request



{

&#x20; "status": "IN PROGRESS"

}



\### Valid Lifecycle



PLANNED → CONFIRMED → IN PROGRESS → COMPLETED



Cancellation is supported through the cancellation endpoint.



Invalid transitions are rejected.



\---



\# 7. Cancel Event



\## PATCH /api/events/:id/cancel



Authentication required.



Role:



\- admin



Example:



PATCH /api/events/2/cancel



\### Response



{

&#x20; "success": true,

&#x20; "message": "Event cancelled successfully",

&#x20; "data": {

&#x20;   "id": 2,

&#x20;   "status": "CANCELLED"

&#x20; }

}



Cancelled events no longer block venue, staff, or equipment availability.



\---



\# 8. Create Vendor



\## POST /api/vendors



Authentication required.



Role:



\- admin



\### Request



{

&#x20; "name": "ABC Decorations",

&#x20; "email": "abc@example.com",

&#x20; "phone": "9876543210",

&#x20; "service\_type": "Decoration"

}



\### Response



{

&#x20; "success": true,

&#x20; "message": "Vendor created successfully",

&#x20; "data": {

&#x20;   "id": 1,

&#x20;   "name": "ABC Decorations",

&#x20;   "email": "abc@example.com",

&#x20;   "phone": "9876543210",

&#x20;   "service\_type": "Decoration"

&#x20; }

}



\---



\# 9. List Vendors



\## GET /api/vendors



Authentication required.



Roles:



\- admin

\- staff



\---



\# 10. Create Service



\## POST /api/services



Authentication required.



Role:



\- admin



\### Request



{

&#x20; "name": "DJ Service",

&#x20; "unit\_price": 12000

}



\### Response



{

&#x20; "success": true,

&#x20; "message": "Service created successfully",

&#x20; "data": {

&#x20;   "id": 4,

&#x20;   "name": "DJ Service",

&#x20;   "unit\_price": 12000

&#x20; }

}



\---



\# 11. List Services



\## GET /api/services



Authentication required.



Roles:



\- admin

\- staff



\---



\# 12. Add Service to Event



\## POST /api/services/events/:eventId



Authentication required.



Role:



\- admin



\### Request



{

&#x20; "serviceId": 4,

&#x20; "quantity": 1

}



\### Response



{

&#x20; "success": true,

&#x20; "message": "Service added to event successfully",

&#x20; "data": {

&#x20;   "eventId": 3,

&#x20;   "serviceId": 4,

&#x20;   "quantity": 1,

&#x20;   "unitPrice": 12000

&#x20; }

}



\---



\# 13. Add Payment



\## POST /api/events/:eventId/payments



Authentication required.



Role:



\- admin



\### Request



{

&#x20; "amount": 5000,

&#x20; "method": "CASH",

&#x20; "reference": "PAY-001"

}



\### Response



{

&#x20; "success": true,

&#x20; "message": "Payment added successfully",

&#x20; "data": {

&#x20;   "id": 1,

&#x20;   "eventId": 1,

&#x20;   "amount": 5000,

&#x20;   "method": "CASH",

&#x20;   "reference": "PAY-001"

&#x20; }

}



Payment amounts are validated against the event total.



\---



\# Business Rules



\## Venue Double Booking



A new event conflicts with an existing blocking event when:



newStart < existingEnd

AND

newEnd > existingStart



Only CONFIRMED and IN PROGRESS events block the hall.



\---



\## Staff Assignment Conflict



A staff member cannot be assigned to overlapping CONFIRMED or IN PROGRESS events.



\---



\## Equipment Availability



Equipment is quantity-based.



Available quantity is calculated from:



total quantity - quantity reserved by overlapping blocking events



The requested quantity must be available before confirmation.



\---



\## Pricing Integrity



Event totals are calculated by the backend.



Client-provided total amounts are not trusted.



Service prices are stored as snapshots on event service records.



\---



\## Event Status



Allowed lifecycle:



PLANNED

CONFIRMED

IN PROGRESS

COMPLETED

CANCELLED



Invalid status transitions are rejected.



\---



\## Authentication and Authorization



JWT authentication is used for protected endpoints.



Roles:



\- admin

\- staff



Administrative operations such as event confirmation, cancellation, vendor creation, service creation, and payment creation require admin authorization.



\---



\## Error Responses



Validation errors return HTTP 400.



Authentication failures return HTTP 401.



Authorization failures return HTTP 403.



Business rule conflicts return an appropriate 400-level error.



Unexpected server errors return HTTP 500.



Example:



{

&#x20; "success": false,

&#x20; "message": "Hall is already booked during this time"

}



\---



\# Test Credentials



Email:



admin@eventerp.com



Password:



Admin@123



Role:



admin

