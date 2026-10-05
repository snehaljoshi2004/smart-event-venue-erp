\# Smart Event \& Venue Operations ERP



Backend API for managing customers, events, venues, halls, staff, vendors, services, equipment, payments, and event execution.



\## Tech Stack



\- Node.js

\- Express.js

\- MySQL 8

\- JWT Authentication

\- bcryptjs



\## Features



\- JWT-based authentication and role authorization

\- Customer and event management

\- Venue and hall management

\- Event booking and scheduling

\- Vendor management

\- Staff assignment

\- Equipment and inventory management

\- Event services

\- Payment and advance tracking

\- Event status lifecycle

\- Audit logging

\- Transaction-based database operations

\- Server-side pricing and availability validation



\## Event Lifecycle



PLANNED → CONFIRMED → IN PROGRESS → COMPLETED



Cancellation is allowed from PLANNED, CONFIRMED, and IN PROGRESS states.



Invalid status transitions are rejected.



\## Business Rules



\### Venue Double Booking



An event cannot be confirmed if another CONFIRMED or IN PROGRESS event overlaps the same hall.



Overlap is calculated using:



newStart < existingEnd

AND

newEnd > existingStart



\### Staff Conflicts



A staff member cannot be assigned to overlapping CONFIRMED or IN PROGRESS events.



\### Equipment Availability



Equipment is quantity-based.



The system checks overlapping event reservations and ensures that the requested quantity does not exceed available inventory.



\### Inventory



Equipment availability is checked before event confirmation.



\### Pricing Integrity



Event totals are calculated server-side using configured service prices.



Client-provided totals are not trusted.



Service prices are also stored as snapshots on event service records.



\### Resource Release



CANCELLED and COMPLETED events do not block future venue, staff, or equipment availability.



\## Project Structure



smart-event-venue-erp/

├── database/

│   └── schema.sql

├── src/

│   ├── config/

│   ├── controllers/

│   ├── middleware/

│   ├── repositories/

│   ├── routes/

│   └── services/

├── .gitignore

├── package.json

├── package-lock.json

├── README.md

└── API.md



Note: The local .env file is intentionally excluded from the repository for security.



\## Setup



\### 1. Clone the repository



git clone https://github.com/snehaljoshi2004/smart-event-venue-erp.git



cd smart-event-venue-erp



\### 2. Install dependencies



npm install



\### 3. Configure environment variables



Create a .env file:



PORT=5000

DB\_HOST=localhost

DB\_PORT=3306

DB\_USER=root

DB\_PASSWORD=your\_mysql\_password

DB\_NAME=event\_erp

JWT\_SECRET=your\_jwt\_secret



\### 4. Create the database



Run the SQL file:



database/schema.sql



using MySQL 8.



\### 5. Start the server



node src/server.js



The API runs on:



http://localhost:5000



\## Health Check



GET /api/health



Expected response:



{

&#x20; "success": true,

&#x20; "message": "Event ERP API is running"

}



\## Authentication



Login endpoint:



POST /api/auth/login



Example request:



{

&#x20; "email": "admin@eventerp.com",

&#x20; "password": "Admin@123"

}



The response contains a JWT token.



Use the token for protected endpoints:



Authorization: Bearer <token>



\## Test Credentials



Email: admin@eventerp.com



Password: Admin@123



Role: admin



This account is provided for assessment and testing purposes.



\## Main API Endpoints



| Method | Endpoint | Purpose |

|--------|----------|---------|

| POST | /api/auth/login | Login |

| GET | /api/health | Health check |

| POST | /api/events | Create event |

| GET | /api/events | List events |

| POST | /api/events/:id/confirm | Confirm event |

| PATCH | /api/events/:id/status | Update event status |

| PATCH | /api/events/:id/cancel | Cancel event |

| GET | /api/vendors | List vendors |

| POST | /api/vendors | Create vendor |

| GET | /api/services | List services |

| POST | /api/services | Create service |

| POST | /api/services/events/:eventId | Add service to event |

| POST | /api/events/:eventId/payments | Add payment |



See API.md for detailed request and response examples.



\## Database



The application uses MySQL 8 with InnoDB tables and foreign-key relationships.



Transactions are used for important event operations such as event creation and event confirmation.



The database contains tables for:



\- Users

\- Customers

\- Venues

\- Halls

\- Events

\- Staff

\- Event Staff

\- Equipment

\- Event Equipment

\- Services

\- Event Services

\- Vendors

\- Event Vendors

\- Payments

\- Audit Logs



\## Validation and Security



\- JWT authentication is required for protected endpoints.

\- Role-based authorization is implemented.

\- Passwords are stored as bcrypt hashes.

\- Client-provided event totals are not trusted.

\- Service prices are calculated server-side.

\- Venue availability is checked before confirmation.

\- Staff conflicts are checked before confirmation.

\- Equipment quantity conflicts are checked before confirmation.

\- Database transactions protect multi-step operations.

\- Environment secrets are stored in .env and excluded from GitHub.



\## Seed and Test Data



The database includes sample data for:



\- Customers

\- Venues

\- Halls

\- Staff

\- Equipment

\- Services

\- Vendors



The project can be tested using the provided admin credentials.



\## Assumptions \& Limitations



\- Event times are stored as UTC DATETIME values.

\- Only CONFIRMED and IN PROGRESS events block resources.

\- COMPLETED and CANCELLED events release resources.

\- Payment amounts are validated against the event total.

\- Vendor assignment functionality can be extended further.

\- Pagination and additional filtering can be extended for larger datasets.

\- Production deployment requires a managed MySQL database.

\- Production secrets should be configured through deployment environment variables.



\## API Documentation



Detailed API documentation is available in:



API.md



\## Author



Snehal Joshi

