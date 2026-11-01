# Baby Gear Exchange API Documentation

This document describes every API endpoint of the Baby Gear Exchange application. The backend and the frontend both build from it, so update this file first whenever an endpoint changes.

## Conventions

These rules apply to every endpoint, so they are written once here and not repeated below.

**Paths and format:** every path starts with `/api`, and requests and responses use JSON.

**Access levels:** Public means anyone. Signed in means a logged-in user. Item owner means the signed-in user who posted the item. Claimer means the signed-in user who made the claim.

**Response format**

Success:

```json
{ "success": true, "data": { "id": "550e8400-e29b-41d4-a716-446655440000" } }
```

Error:

```json
{ "success": false, "message": "Item not found" }
```

Everything the frontend needs is inside `data`. Nothing else sits next to it.

**Error codes**

| Code | Meaning                                                                      | Written on each endpoint?                                                              |
| ---- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 400  | Invalid input                                                                | Yes                                                                                    |
| 401  | Not signed in                                                                | No, it applies to every endpoint that needs a signed-in user                           |
| 403  | Signed in but not allowed. Also used when the CSRF token is missing or wrong | Only the "not allowed" case. The CSRF case applies to every endpoint that changes data |
| 404  | Not found                                                                    | Yes                                                                                    |
| 409  | Conflicts with the current state (for example, the item is already reserved) | Yes                                                                                    |
| 429  | Too many requests                                                            | Yes                                                                                    |
| 500  | Server error                                                                 | No, it applies to every endpoint                                                       |

To keep each endpoint short, the sections after this one only list the errors marked "Yes" in the last column.

**IDs:** all ids are UUID strings, for example `550e8400-e29b-41d4-a716-446655440000`.

**Values** (they must match the database)

- Item condition: `new`, `like_new`, `good`, `used`
- Item status: `available`, `reserved`, `picked_up`, `withdrawn`
- Claim status: `pending`, `approved`, `declined`, `cancelled`, `no_show`, `picked_up`
- Ages are in months.

**Signing in and CSRF**

- Register and log in set a JWT in an httpOnly cookie (SameSite=Lax, secure in production, expires in 1 day). The browser sends it automatically on every request.
- Register, log in and `GET /api/users/me` return a `csrfToken` inside `data`. The frontend keeps it and sends it in the `X-CSRF-TOKEN` header on every POST, PATCH, PUT and DELETE request. If it is missing or does not match, the API returns 403.
- Register and log in are the only requests that change data without this header, because the token does not exist yet.
- Endpoints marked "CSRF header required" below follow this rule.

**Private pickup address:** the street address, pickup instructions and availability are never in a public response (the item list or the item details). A claimer receives them only inside their own claim in `GET /api/profile/claims`, and only while that claim is `approved`. Once the item is picked up, the address is no longer shared.

### Authentication Endpoints

#### Register User

`POST /api/users/register` | Access: Public

**Request body**

| Field    | Type   | Rules                                                                                   |
| -------- | ------ | --------------------------------------------------------------------------------------- |
| name     | string | Required, 2 to 50 characters                                                            |
| email    | string | Required, valid email address (saved in lowercase)                                      |
| password | string | Required, at least 8 characters, with 1 lowercase letter, 1 capital letter and 1 number |

**Example request**

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "Password123"
}
```

**Success response (201 Created)**

The user is signed in right away. The password is never returned.

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "user"
    },
    "csrfToken": "example-csrf-token"
  }
}
```

**Errors**

| Code | Meaning                          |
| ---- | -------------------------------- |
| 400  | Invalid name, email or password  |
| 409  | That email is already registered |

#### Log In User

`POST /api/users/logon` | Access: Public

**Request body**

| Field    | Type   | Rules                         |
| -------- | ------ | ----------------------------- |
| email    | string | Required, valid email address |
| password | string | Required                      |

**Example request**

```json
{
  "email": "jane@example.com",
  "password": "Password123"
}
```

**Success response (200 OK)**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "user"
    },
    "csrfToken": "example-csrf-token"
  }
}
```

**Errors**

| Code | Meaning                                                                                  |
| ---- | ---------------------------------------------------------------------------------------- |
| 400  | Missing or invalid input                                                                 |
| 401  | Incorrect email or password (the same message for a wrong password and an unknown email) |

#### Log Out User

**Method:** POST
**Path:** `/api/users/logoff`
**Access:** Signed-in users

**Query Parameters**

None.

**Request Body**

None proposed.

**Success Response (proposed)**

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

**Possible Errors**

| Code | Meaning                       |
| ---- | ----------------------------- |
| 401  | User is not signed in         |
| 403  | Missing or invalid CSRF token |
| 500  | Internal server error         |

**Security**

The request must include the `X-CSRF-TOKEN` header.

The server should clear the user's authentication cookie.

**Note:** The success response, cookie handling, and error cases must be confirmed with the backend team.

#### Get Current User

`GET /api/users/me` | Access: Signed in

**Success response (200 OK)**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "user"
    },
    "csrfToken": "example-csrf-token"
  }
}
```

### Categories Endpoints

#### Get Categories

`GET /api/categories` | Access: Public

Sorted by `sortOrder`. The `key` is the value used to filter items and to create an item. The `name` is the text shown to users.

**Success response (200 OK)**

```json
{
  "success": true,
  "data": [
    {
      "id": "b7c1d3a2-5e4f-4a6b-9c8d-2e1f0a9b8c7d",
      "key": "strollers",
      "name": "Strollers"
    },
    {
      "id": "c8d9e0f1-a2b3-4c4d-8e5f-6a7b8c9d0e1f",
      "key": "clothing",
      "name": "Clothing"
    }
  ]
}
```

### Addresses Endpoints

#### Get Addresses

`GET /api/addresses` | Access: Signed in

Returns only the signed-in user's own addresses, with the default address first.

**Success response (200 OK)**

```json
{
  "success": true,
  "data": [
    {
      "id": "a3bb189e-8bf9-4888-9912-ace4e6543002",
      "nickname": "Home",
      "line1": "123 Main Street",
      "line2": "Apt 2",
      "city": "San Rafael",
      "state": "CA",
      "postalCode": "94901",
      "isDefault": true
    }
  ]
}
```

#### Create Address

`POST /api/addresses` | Access: Signed in, CSRF header required

The first address a user creates becomes their default. If `isDefault` is `true` on a new address, the old default is cleared.

**Request body**

| Field      | Type    | Rules                        |
| ---------- | ------- | ---------------------------- |
| line1      | string  | Required                     |
| line2      | string  | Optional                     |
| city       | string  | Required                     |
| state      | string  | Required                     |
| postalCode | string  | Required                     |
| nickname   | string  | Optional, for example "Home" |
| isDefault  | boolean | Optional, default `false`    |

**Example request**

```json
{
  "nickname": "Home",
  "line1": "123 Main Street",
  "city": "San Rafael",
  "state": "CA",
  "postalCode": "94901",
  "isDefault": true
}
```

**Success response (201 Created)**

The new address, in the same shape as Get Addresses.

**Errors**

| Code | Meaning                           |
| ---- | --------------------------------- |
| 400  | Missing or invalid address fields |

### Items Endpoints

#### Get Items

`GET /api/items` | Access: Public

**Query parameters** (all optional)

| Parameter | Type   | Description                                                      |
| --------- | ------ | ---------------------------------------------------------------- |
| q         | string | Search text. Matches the title or the description, ignoring case |
| category  | string | Category key, for example `strollers` (exact match)              |
| condition | string | One of `new`, `like_new`, `good`, `used` (exact match)           |
| ageMin    | number | Minimum age in months                                            |
| ageMax    | number | Maximum age in months                                            |
| city      | string | City name, ignoring case                                         |
| page      | number | Page number, default 1                                           |
| limit     | number | Items per page, default 12, maximum 50                           |

An item matches the age filter when its age range overlaps `ageMin` to `ageMax`. An item with no minimum or no maximum counts as open on that side.

**Success response (200 OK)**

Newest first. Withdrawn items are never returned. Reserved and picked up items are returned with their status. Each item has no description, owner or address.

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Baby Stroller",
        "condition": "good",
        "ageMinMonths": 0,
        "ageMaxMonths": 24,
        "city": "San Rafael",
        "state": "CA",
        "status": "available",
        "category": { "key": "strollers", "name": "Strollers" },
        "coverPhoto": {
          "url": "https://res.cloudinary.com/example/image/upload/hand-me-down/items/stroller.jpg",
          "altText": "Grey baby stroller"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 1,
      "pages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

**Errors**

| Code | Meaning                  |
| ---- | ------------------------ |
| 400  | Invalid query parameters |

#### Get Item Details

`GET /api/items/:id` | Access: Public

**Path parameters**

| Parameter | Type   | Description           |
| --------- | ------ | --------------------- |
| id        | string | ID (UUID) of the item |

**Success response (200 OK)**

Photos are ordered by `position`.

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Baby Stroller",
    "description": "A gently used baby stroller.",
    "category": { "key": "strollers", "name": "Strollers" },
    "owner": {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "name": "Jane Smith"
    },
    "condition": "good",
    "ageMinMonths": 0,
    "ageMaxMonths": 24,
    "city": "San Rafael",
    "state": "CA",
    "postalCode": "94901",
    "status": "available",
    "photos": [
      {
        "id": "d4e5f6a7-b8c9-4d0e-a1b2-c3d4e5f6a7b8",
        "url": "https://res.cloudinary.com/example/image/upload/hand-me-down/items/stroller.jpg",
        "altText": "Grey baby stroller",
        "position": 0
      }
    ],
    "createdAt": "2026-10-20T15:04:05.000Z"
  }
}
```

**Errors**

| Code | Meaning                                                                 |
| ---- | ----------------------------------------------------------------------- |
| 404  | Item not found (not a valid id, no such item, or the item is withdrawn) |

#### Create Item

**Method:** POST
**Path:** `/api/items`
**Access:** Signed-in users

**Query Parameters**

None.
**Open question for the team:** Please confirm the
item ID format used by the backend.
**Request Body (proposed)**

| Field                            | Type             | Validation                                        |
| -------------------------------- | ---------------- | ------------------------------------------------- |
| title                            | string           | Required; length TBD                              |
| description                      | string           | Required; length TBD                              |
| categoryId                       | string           | Required; valid category ID                       |
| condition                        | string           | Required; one of: new, like_new, good, used       |
| ageMin                           | number           | Optional; minimum age                             |
| ageMax                           | number           | Optional; maximum age                             |
| addressId                        | string           | Required; valid address belonging to user         |
| photos                           | array of strings | Optional; Cloudinary image references, limits TBD |
| **Open questions for the team:** |

- What are the maximum allowed lengths for the item title and description?
- What is the maximum number of photos allowed per item?

**Example Request (proposed)**

```json
{
  "title": "Baby Stroller",
  "description": "A gently used baby stroller.",
  "categoryId": "1",
  "condition": "good",
  "ageMin": 0,
  "ageMax": 24,
  "addressId": "1",
  "photos": []
}
```

**Success Response (proposed)**

```json
{
  "success": true,
  "data": {
    "id": "10",
    "title": "Baby Stroller",
    "status": "available"
  }
}
```

**Possible Errors**

| Code | Meaning                                   |
| ---- | ----------------------------------------- |
| 400  | Missing or invalid item fields            |
| 401  | User is not signed in                     |
| 403  | User is not authorized to use the address |
| 404  | Category or address not found             |
| 500  | Internal server error                     |

**Security**

The request must include the `X-CSRF-TOKEN` header.

Only signed-in users can create items. The server must verify that the selected address belongs to the user.

Do not expose the private pickup address in public item responses.

### Uploads Endpoints

#### Get Upload Signature

`POST /api/uploads/signature` | Access: Signed in, CSRF header required

The browser uploads photos straight to Cloudinary with a short-lived signature from this endpoint, so photos never pass through our server. The folder is fixed on the server, and the allowed image types are jpg, png and webp. After uploading, the frontend sends each photo's `url`, `publicId` and optional `altText` when it creates the item.

**Success response (200 OK)**

```json
{
  "success": true,
  "data": {
    "cloudName": "example-cloud",
    "apiKey": "example-api-key",
    "timestamp": 1234567890,
    "folder": "hand-me-down/items",
    "signature": "example-signature"
  }
}
```

The Cloudinary API secret is never returned.

**Errors**

| Code | Meaning                                                    |
| ---- | ---------------------------------------------------------- |
| 429  | Too many signature requests (the endpoint is rate limited) |

### Claims Endpoints

#### Create Claim

**Method:** POST
**Path:** `/api/items/:id/claims`
**Access:** Signed-in users (proposed)

**Path Parameters**

| Parameter | Type   | Description                            |
| --------- | ------ | -------------------------------------- |
| id        | string | ID of the item being claimed; type TBD |

**Query Parameters**

None.

**Request Body**


The request body accepts an optional `message` field (string, trimmed, maximum 500 characters). If provided, it must not exceed 500 characters.

**Example Request Body:**

```json
{
  "message": "Hi, I am interested in this item. Is it still available?"
}
````

If no message is provided, send an empty JSON object (`{}`).

**Success Response (201 Created)**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "itemId": "550e8400-e29b-41d4-a716-446655440001",
    "status": "pending"
  }
}
```

**Possible Errors**

**Possible Errors**

| Code | Meaning                                                                                       |
| ---- | --------------------------------------------------------------------------------------------- |
| 400  | Invalid item ID or request body                                                               |
| 401  | User is not signed in                                                                         |
| 403  | User cannot claim an item they own                                                            |
| 404  | Item not found                                                                                |
| 409  | Item is picked_up or withdrawn, or the user already has an active claim (pending or approved) |
| 500  | Internal server error                                                                         |

**Waiting List:** Users may create claims on reserved items. These claims remain pending until the owner takes action.

**Security**

Only signed-in users can create claims. The request must include the `X-CSRF-TOKEN` header.

The server verifies the user's JWT authentication cookie and CSRF token. A missing or invalid CSRF token returns 403.

Users cannot claim their own items (403). Claims are allowed on available or reserved items, but not on picked_up or withdrawn items (409).

A user cannot create another claim for the same item while they already have a pending or approved claim (409).

#### Get Item Claims

**Method:** GET
**Path:** `/api/items/:id/claims`
**Access:** Item owner (signed in)

**Path Parameters**

| Parameter | Type   | Description              |
| --------- | ------ | ------------------------ |
| id        | string | ID of the item; type TBD |

**Query Parameters**

None proposed.

**Request Body**

None.

**Success Response**

```json
{
  "success": true,
  "data": [
    {
      "id": "20",
      "itemId": "10",
      "status": "pending"
    }
  ]
}
```

**Possible Errors**

| Code | Meaning                    |
| ---- | -------------------------- |
| 400  | Invalid item ID            |
| 401  | User is not signed in      |
| 403  | User is not the item owner |
| 404  | Item not found             |
| 500  | Internal server error      |

**Security**

Uses the user's authentication cookie.

Only the item owner should be able to view claims submitted for their item (proposed).

Do not expose private information to unauthorized users.

**Note:** Access rules, response fields, and error cases must be confirmed with the backend team.

#### Update Claim

**Method:** PATCH
**Path:** `/api/claims/:id`
**Access:** Item owner (signed in)

**Path Parameters**

| Parameter | Type   | Description       |
| --------- | ------ | ----------------- |
| id        | string | UUID of the claim |

**Query Parameters**

None.

**Request Body**

| Field | Type | Validation |
| ----- | ---- | ---------- |

| status | string | Required; allowed values: `approved`, `declined`. Only a `pending` claim can be updated. |

**Example Request**

```json
{
  "status": "approved"
}
```

**Success Response (proposed)**

```json
{
  "success": true,
  "data": {
    "id": "20",
    "status": "approved"
  }
}
```

**Possible Errors**

| Code | Meaning                                      |
| ---- | -------------------------------------------- |
| 400  | Invalid claim ID or status                   |
| 401  | User is not signed in                        |
| 403  | User is not the item owner                   |
| 404  | Claim not found                              |
| 409  | Claim cannot be updated in its current state |
| 500  | Internal server error                        |

**Security**

The request must include the `X-CSRF-TOKEN` header.

Only the item owner should be able to approve or decline a claim (proposed).

**Note:** Allowed status values, request body, access rules, response fields, and error cases must be confirmed with the backend team.

#### Cancel Claim

**Method:** PATCH
**Path:** `/api/claims/:id/cancel`
**Access:** Claimer (proposed)

**Path Parameters**

| Parameter                                                                                  | Type   | Description               |
| ------------------------------------------------------------------------------------------ | ------ | ------------------------- |
| id                                                                                         | string | ID of the claim; type TBD |
| **Open question for the team:** Please confirm the claim ID format used for this endpoint. |
| **Query Parameters**                                                                       |

None.
**Request Body**

No request body is proposed. Confirm with the backend team.

**Success Response (proposed)**

```json
{
  "success": true,
  "data": {
    "id": "20",
    "status": "canceled"
  }
}
```

**Possible Errors**

| Code | Meaning                                        |
| ---- | ---------------------------------------------- |
| 400  | Invalid claim ID or request                    |
| 401  | User is not signed in                          |
| 403  | User is not the claimer                        |
| 404  | Claim not found                                |
| 409  | Claim cannot be cancelled in its current state |
| 500  | Internal server error                          |

**Security**

The request must include the `X-CSRF-TOKEN` header.

Only the user who submitted the claim should be allowed to cancel it (proposed).

**Note:** Cancellation rules, status values, response fields, and error cases must be confirmed with the backend team.

#### Mark Claim as No-Show

**Method:** PATCH
**Path:** `/api/claims/:id/no-show`
**Access:** Item owner (proposed)

**Path Parameters**

| Parameter                                                                                    | Type   | Description               |
| -------------------------------------------------------------------------------------------- | ------ | ------------------------- |
| id                                                                                           | string | ID of the claim; type TBD |
| **Open question for the team:** Please confirm the claim ID format for the No-Show endpoint. |

**Query Parameters**

None.

**Request Body**

No request body is proposed. Confirm with the backend team.

**Success Response (proposed)**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "no_show"
  }
}
```

**Possible Errors**

| Code | Meaning                                                |
| ---- | ------------------------------------------------------ |
| 400  | Invalid claim ID or request                            |
| 401  | User is not signed in                                  |
| 403  | User is not the item owner                             |
| 404  | Claim not found                                        |
| 409  | Claim cannot be marked as no-show in its current state |
| 500  | Internal server error                                  |

**Security**

The request must include the `X-CSRF-TOKEN` header.

Only the item owner should be allowed to mark a claimer as a no-show (proposed).

**Note:** No-show rules, status values, response fields, and error cases must be confirmed with the backend team.

#### Mark Item as Picked Up

**Method:** PATCH
**Path:** `/api/items/:id/picked-up`
**Access:** Item owner (proposed)

**Path Parameters**

| Parameter                                                                                          | Type   | Description              |
| -------------------------------------------------------------------------------------------------- | ------ | ------------------------ |
| id                                                                                                 | string | ID of the item; type TBD |
| **Open question for the team:** Please confirm the item ID format used for the Picked Up endpoint. |

**Request Body**

No request body is proposed. Confirm with the backend team.

**Success Response (proposed)**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "picked_up"
  }
}
```

**Possible Errors**

| Code | Meaning                                                 |
| ---- | ------------------------------------------------------- |
| 400  | Invalid item ID or request                              |
| 401  | User is not signed in                                   |
| 403  | User is not allowed to update this item                 |
| 404  | Item not found                                          |
| 409  | Item cannot be marked as picked up in its current state |
| 500  | Internal server error                                   |

**Security**

The request must include the `X-CSRF-TOKEN` header.

Only the item owner should be allowed to mark an item as picked up (proposed).

**Note:** The status value, access rules, response fields, and error cases must be confirmed with the backend team.

### Profile Endpoints

The Profile API allows signed-in users to view their donations, claims, and activity statistics.

#### Get My Items

**Method:** GET
**Path:** `/api/profile/items`
**Access:** Signed-in users

**Query Parameters**

None specified in JIRA-48.

**Request Body**

None.

**Success Response (proposed example)**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Baby Stroller",
      "status": "available"
    }
  ]
}
```

**Possible Errors**

| Code | Meaning               |
| ---- | --------------------- |
| 401  | User is not signed in |
| 500  | Internal server error |

**Security**

Only return items belonging to the signed-in user.

**Note:** The response fields, ID types, access rules, and error cases must be confirmed with the backend team.

#### Get My Claims

**Method:** GET
**Path:** `/api/profile/claims`
**Access:** Signed-in users

**Query Parameters**

None specified in JIRA-48.

**Request Body**

None.

**Success Response (proposed example)**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "itemId": "550e8400-e29b-41d4-a716-446655440001",
      "status": "pending"
    }
  ]
}
```

**Possible Errors**

| Code | Meaning               |
| ---- | --------------------- |
| 401  | User is not signed in |
| 500  | Internal server error |

**Security**

Only return claims submitted by the signed-in user.

**Note:** The response fields, ID types, access rules, and error cases must be confirmed with the backend team.

#### Get Profile Statistics

**Method:** GET
**Path:** `/api/profile/stats`
**Access:** Signed-in users

**Query Parameters**

None.

**Request Body**

None.

**Success Response (example)**

```json
{
  "success": true,
  "data": {
    "donations": {
      "posted": 5,
      "waitingForYou": 2,
      "approved": 1,
      "pickedUp": 2
    },
    "claims": {
      "requested": 3,
      "waitingForOwner": 1,
      "approved": 1,
      "pickedUp": 1
    }
  }
}
```

**Response Fields**

All statistics are whole numbers representing activity for the signed-in user.

**Donations**

- `posted`: Number of posted donations
- `waitingForYou`: Donations with claims awaiting action from the signed-in item owner
- `approved`: Approved donations
- `pickedUp`: Donations marked as picked up

**Claims**

- `requested`: Number of claims requested
- `waitingForOwner`: Claims waiting for owner action
- `approved`: Approved claims
- `pickedUp`: Claims for items picked up

**Possible Errors**

| Code | Meaning               |
| ---- | --------------------- |
| 401  | User is not signed in |
| 500  | Internal server error |

**Security**

Only return statistics belonging to the signed-in user.

**Note:** The response field names are required by JIRA-48. The exact counting rules and error cases must be confirmed with the backend team.

### Messages Endpoints

The Messages API allows users involved in a claim to communicate about the item.

#### Send Message

**Method:** POST
**Path:** `/api/claims/:id/messages`
**Access:** Item owner or claimer (proposed)

**Path Parameters**

| Parameter                                                                                     | Type   | Description               |
| --------------------------------------------------------------------------------------------- | ------ | ------------------------- |
| id                                                                                            | string | ID of the claim; type TBD |
| **Open question for the team:** Please confirm the claim ID format used for sending messages. |
| **Request Body (proposed)**                                                                   |

| Field                                                                                                 | Type   | Validation                               |
| ----------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------- |
| content                                                                                               | string | Required; minimum and maximum length TBD |
| **Open question for the team:** What are the minimum and maximum allowed lengths for message content? |
| **Example Request**                                                                                   |

```json id="d29h3a"
{
  "content": "Hello, is the stroller still available for pickup?"
}
```

**Success Response (proposed)**

```json id="m18n4b"
{
  "success": true,
  "data": {
    "id": "1",
    "claimId": "10",
    "content": "Hello, is the stroller still available for pickup?"
  }
}
```

**Possible Errors**

| Code | Meaning                                         |
| ---- | ----------------------------------------------- |
| 400  | Invalid message content                         |
| 401  | User is not signed in                           |
| 403  | User is not allowed to message about this claim |
| 404  | Claim not found                                 |
| 500  | Internal server error                           |

**Security**

The request must include the `X-CSRF-TOKEN` header.

Only authorized participants in the claim should be able to send messages (proposed).

**Note:** Request fields, message length limits, response fields, access rules, and error cases must be confirmed with the backend team.

#### Get Messages

**Method:** GET
**Path:** `/api/claims/:id/messages`
**Access:** Item owner or claimer (proposed)

**Path Parameters**

| Parameter                                                                                        | Type   | Description               |
| ------------------------------------------------------------------------------------------------ | ------ | ------------------------- |
| id                                                                                               | string | ID of the claim; type TBD |
| **Open question for the team:** Please confirm the claim ID format used for retrieving messages. |

**Query Parameters**

None proposed.

**Request Body**

None.

**Success Response (proposed example)**

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "claimId": "10",
      "content": "Hello, is the stroller available for pickup?"
    }
  ]
}
```

**Possible Errors**

| Code | Meaning                                       |
| ---- | --------------------------------------------- |
| 400  | Invalid claim ID                              |
| 401  | User is not signed in                         |
| 403  | User is not authorized to view these messages |
| 404  | Claim not found                               |
| 500  | Internal server error                         |

**Security**

Only authorized participants in the claim should be able to view messages.

**Note:** Response fields, access rules, and error cases must be confirmed with the backend team.

#### Mark Messages as Read

**Method:** PATCH
**Path:** `/api/claims/:id/messages/read`
**Access:** Item owner or claimer (proposed)

**Path Parameters**

| Parameter                                                                                             | Type   | Description               |
| ----------------------------------------------------------------------------------------------------- | ------ | ------------------------- |
| id                                                                                                    | string | ID of the claim; type TBD |
| **Open question for the team:** Please confirm the claim ID format used for marking messages as read. |

**Request Body**

No request body is proposed. Confirm with the backend team whether message IDs or other fields are required.

**Success Response (proposed)**

```json
{
  "success": true,
  "data": {
    "updatedCount": 2
  }
}
```

**Possible Errors**

| Code | Meaning                                         |
| ---- | ----------------------------------------------- |
| 400  | Invalid claim ID or request                     |
| 401  | User is not signed in                           |
| 403  | User is not authorized to update these messages |
| 404  | Claim not found                                 |
| 500  | Internal server error                           |

**Security**

The request must include the `X-CSRF-TOKEN` header.

Only authorized claim participants should be allowed to mark messages addressed to them as read (proposed).

**Note:** The request body, response fields, access rules, and error cases must be confirmed with the backend team.
