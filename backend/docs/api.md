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

`POST /api/users/logoff` | Access: Signed in, CSRF header required

Clears the login cookie.

**Success response (200 OK)**

```json
{
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```

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
| country    | string  | Required                     |
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
        "childAgeMinMonths": 0,
        "childAgeMaxMonths": 24,
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
    "childAgeMinMonths": 0,
    "childAgeMaxMonths": 24,
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

`POST /api/items` | Access: Signed in, CSRF header required

The owner is always the signed-in user, never a value from the request body. The item's city, state and postal code are copied from the chosen address. The item, its photos and its pickup details are saved together, so a failure leaves nothing half saved.

**Request body**

| Field             | Type   | Rules                                                                                                                    |
| ----------------- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| title             | string | Required, up to 80 characters                                                                                            |
| description       | string | Required, up to 1000 characters                                                                                          |
| category          | string | Required, the key of an existing category, for example `strollers`                                                       |
| condition         | string | Required, one of `new`, `like_new`, `good`, `used`                                                                       |
| childAgeMinMonths | number | Optional, whole number from 0 to 120, not greater than `childAgeMaxMonths`                                               |
| childAgeMaxMonths | number | Optional, whole number from 0 to 120                                                                                     |
| addressId         | string | Required, ID of one of the user's own addresses                                                                          |
| photos            | array  | Required, 1 to 6 objects of `url`, `publicId` and optional `altText`. Each `url` must start with our Cloudinary base URL |
| instructions      | string | Optional, up to 300 characters                                                                                           |
| availability      | string | Optional, up to 200 characters                                                                                           |

**Example request**

```json
{
  "title": "Baby Stroller",
  "description": "A gently used baby stroller.",
  "category": "strollers",
  "condition": "good",
  "childAgeMinMonths": 0,
  "childAgeMaxMonths": 24,
  "addressId": "a3bb189e-8bf9-4888-9912-ace4e6543002",
  "photos": [
    {
      "url": "https://res.cloudinary.com/example/image/upload/hand-me-down/items/stroller.jpg",
      "publicId": "hand-me-down/items/stroller",
      "altText": "Grey baby stroller"
    }
  ]
}
```

**Success response (201 Created)**

The new item with status `available`, in the same shape as Get Item Details. It does not include the street address.

**Errors**

| Code | Meaning                                                                                     |
| ---- | ------------------------------------------------------------------------------------------- |
| 400  | Missing or invalid item fields                                                              |
| 404  | Category or address not found (an address that belongs to another user counts as not found) |

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

`POST /api/items/:id/claims` | Access: Signed in, CSRF header required

A new claim starts as `pending`. Users can also claim a reserved item. Those claims stay pending and join the waiting list.

**Path parameters**

| Parameter | Type   | Description                         |
| --------- | ------ | ----------------------------------- |
| id        | string | ID (UUID) of the item being claimed |

**Request body**

| Field   | Type   | Rules                                   |
| ------- | ------ | --------------------------------------- |
| message | string | Optional, trimmed, up to 500 characters |

If there is no message, send an empty object (`{}`).

**Example request**

```json
{
  "message": "Hi, I am interested in this item. Is it still available?"
}
```

**Success response (201 Created)**

```json
{
  "success": true,
  "data": {
    "id": "9b2f3c1e-6d4a-4f7b-8c2d-1a5e7f9b3c4d",
    "itemId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending"
  }
}
```

**Errors**

| Code | Meaning                                                                                                     |
| ---- | ----------------------------------------------------------------------------------------------------------- |
| 400  | Invalid item ID or message                                                                                  |
| 403  | The user owns the item                                                                                      |
| 404  | Item not found                                                                                              |
| 409  | The item is `picked_up` or `withdrawn`, or the user already has an active (pending or approved) claim on it |

#### Get Item Claims

`GET /api/items/:id/claims` | Access: Item owner

Newest first. It never includes the pickup address.

**Path parameters**

| Parameter | Type   | Description           |
| --------- | ------ | --------------------- |
| id        | string | ID (UUID) of the item |

**Query parameters** (optional)

| Parameter | Type   | Description                                         |
| --------- | ------ | --------------------------------------------------- |
| status    | string | Only claims with this status, for example `pending` |

**Success response (200 OK)**

```json
{
  "success": true,
  "data": [
    {
      "id": "9b2f3c1e-6d4a-4f7b-8c2d-1a5e7f9b3c4d",
      "itemId": "550e8400-e29b-41d4-a716-446655440000",
      "status": "pending",
      "message": "Hi, I am interested in this item.",
      "claimer": {
        "id": "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
        "name": "Sam Lee"
      },
      "createdAt": "2026-10-21T10:00:00.000Z"
    }
  ]
}
```

**Errors**

| Code | Meaning                        |
| ---- | ------------------------------ |
| 400  | Invalid item ID or status      |
| 403  | The user is not the item owner |
| 404  | Item not found                 |

#### Update Claim

`PATCH /api/claims/:id` | Access: Item owner, CSRF header required

The owner approves or declines a pending claim.

**Path parameters**

| Parameter | Type   | Description            |
| --------- | ------ | ---------------------- |
| id        | string | ID (UUID) of the claim |

**Request body**

| Field  | Type   | Rules                              |
| ------ | ------ | ---------------------------------- |
| status | string | Required, `approved` or `declined` |

**Example request**

```json
{
  "status": "approved"
}
```

**What happens**

- Only a `pending` claim can be updated.
- Approve: the claim becomes `approved` and the item becomes `reserved`, in one transaction. Other pending claims are not changed, so they stay as a waiting list.
- If the item already has an approved claim, the request returns 409 with a clear message. If two approvals arrive at the same time, only one succeeds and the other returns 409.
- Decline changes only that claim.

**Success response (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "9b2f3c1e-6d4a-4f7b-8c2d-1a5e7f9b3c4d",
    "status": "approved"
  }
}
```

**Errors**

| Code | Meaning                                                             |
| ---- | ------------------------------------------------------------------- |
| 400  | Invalid claim ID or status                                          |
| 403  | The user is not the item owner                                      |
| 404  | Claim not found                                                     |
| 409  | The claim is not pending, or the item already has an approved claim |

#### Cancel Claim

`PATCH /api/claims/:id/cancel` | Access: Claimer, CSRF header required

No request body.

**Path parameters**

| Parameter | Type   | Description            |
| --------- | ------ | ---------------------- |
| id        | string | ID (UUID) of the claim |

**What happens**

- Allowed only while the claim is `pending` or `approved`.
- Cancelling an approved claim also sets the item back to `available` (and clears its reserved time), in one transaction.

**Success response (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "9b2f3c1e-6d4a-4f7b-8c2d-1a5e7f9b3c4d",
    "status": "cancelled"
  }
}
```

**Errors**

| Code | Meaning                              |
| ---- | ------------------------------------ |
| 403  | The user is not the claimer          |
| 404  | Claim not found                      |
| 409  | The claim is not pending or approved |

#### Mark Claim as No-Show

`PATCH /api/claims/:id/no-show` | Access: Item owner, CSRF header required

No request body.

**Path parameters**

| Parameter | Type   | Description            |
| --------- | ------ | ---------------------- |
| id        | string | ID (UUID) of the claim |

**What happens**

- The claim must be `approved`.
- The claim becomes `no_show` and the item becomes `available`, in one transaction, so the owner can approve another pending claim.

**Success response (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "9b2f3c1e-6d4a-4f7b-8c2d-1a5e7f9b3c4d",
    "status": "no_show"
  }
}
```

**Errors**

| Code | Meaning                        |
| ---- | ------------------------------ |
| 403  | The user is not the item owner |
| 404  | Claim not found                |
| 409  | The claim is not approved      |

#### Mark Item as Picked Up

`PATCH /api/items/:id/picked-up` | Access: Item owner, CSRF header required

No request body.

**Path parameters**

| Parameter | Type   | Description           |
| --------- | ------ | --------------------- |
| id        | string | ID (UUID) of the item |

**What happens**

The item must be `reserved`. In one transaction, the approved claim becomes `picked_up`, the item becomes `picked_up`, and every remaining pending claim becomes `declined`.

**Success response (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "picked_up"
  }
}
```

**Errors**

| Code | Meaning                        |
| ---- | ------------------------------ |
| 403  | The user is not the item owner |
| 404  | Item not found                 |
| 409  | The item is not reserved       |

### Profile Endpoints

#### Get My Items

`GET /api/profile/items` | Access: Signed in

The signed-in user's own items, newest first, in the same short shape as the items in Get Items. Withdrawn items are included, so the owner can restore them.

**Success response (200 OK)**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Baby Stroller",
      "condition": "good",
      "childAgeMinMonths": 0,
      "childAgeMaxMonths": 24,
      "city": "San Rafael",
      "state": "CA",
      "status": "withdrawn",
      "category": { "key": "strollers", "name": "Strollers" },
      "coverPhoto": {
        "url": "https://res.cloudinary.com/example/image/upload/hand-me-down/items/stroller.jpg",
        "altText": "Grey baby stroller"
      }
    }
  ]
}
```

#### Get My Claims

`GET /api/profile/claims` | Access: Signed in

The claims the signed-in user has made, newest first.

**Query parameters** (optional)

| Parameter | Type   | Description                                          |
| --------- | ------ | ---------------------------------------------------- |
| status    | string | Only claims with this status, for example `approved` |

**Success response (200 OK)**

`pickup` is `null` unless the claim is `approved`. This is the only place a claimer receives the street address, and it stops being shared once the item is picked up.

```json
{
  "success": true,
  "data": [
    {
      "id": "9b2f3c1e-6d4a-4f7b-8c2d-1a5e7f9b3c4d",
      "status": "approved",
      "createdAt": "2026-10-21T10:00:00.000Z",
      "item": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Baby Stroller",
        "status": "reserved",
        "coverPhoto": {
          "url": "https://res.cloudinary.com/example/image/upload/hand-me-down/items/stroller.jpg",
          "altText": "Grey baby stroller"
        }
      },
      "pickup": {
        "line1": "123 Main Street",
        "line2": "Apt 2",
        "city": "San Rafael",
        "state": "CA",
        "postalCode": "94901",
        "instructions": "Ring the bell twice",
        "availability": "Weekdays after 5pm"
      }
    }
  ]
}
```

**Errors**

| Code | Meaning        |
| ---- | -------------- |
| 400  | Invalid status |

#### Get Profile Statistics

`GET /api/profile/stats` | Access: Signed in

Every number is a whole number for the signed-in user. A user with no activity gets zeros.

**Success response (200 OK)**

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

**Donations**

- `posted`: items you posted, not counting withdrawn items
- `waitingForYou`: pending claims on your items, waiting for your decision
- `approved`: your items that have an approved claim
- `pickedUp`: your items that were picked up

**Claims**

- `requested`: claims you have made
- `waitingForOwner`: your claims that are pending, waiting for the owner
- `approved`: your claims that the owner approved
- `pickedUp`: your claims for items that were picked up

### Messages Endpoints

#### Send Message

`POST /api/claims/:id/messages` | Access: Item owner or claimer, CSRF header required

Only the item owner and the claimer of this claim can send a message, and only while the claim is `pending` or `approved`.

**Path parameters**

| Parameter | Type   | Description            |
| --------- | ------ | ---------------------- |
| id        | string | ID (UUID) of the claim |

**Request body**

| Field | Type   | Rules                                   |
| ----- | ------ | --------------------------------------- |
| body  | string | Required, trimmed, 1 to 2000 characters |

**Example request**

```json
{
  "body": "Hello, is the stroller still available for pickup?"
}
```

**Success response (201 Created)**

`readAt` is `null` until the other person reads the message.

```json
{
  "success": true,
  "data": {
    "id": "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
    "claimId": "9b2f3c1e-6d4a-4f7b-8c2d-1a5e7f9b3c4d",
    "senderId": "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
    "body": "Hello, is the stroller still available for pickup?",
    "readAt": null,
    "createdAt": "2026-10-21T10:05:00.000Z"
  }
}
```

**Errors**

| Code | Meaning                                       |
| ---- | --------------------------------------------- |
| 400  | Invalid claim ID or message body              |
| 403  | The user is not the item owner or the claimer |
| 404  | Claim not found                               |
| 409  | The claim is not pending or approved          |

#### Get Messages

`GET /api/claims/:id/messages` | Access: Item owner or claimer

The messages of one claim, oldest first, so the thread reads from top to bottom.

**Path parameters**

| Parameter | Type   | Description            |
| --------- | ------ | ---------------------- |
| id        | string | ID (UUID) of the claim |

**Success response (200 OK)**

```json
{
  "success": true,
  "data": [
    {
      "id": "e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b",
      "claimId": "9b2f3c1e-6d4a-4f7b-8c2d-1a5e7f9b3c4d",
      "senderId": "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
      "body": "Hello, is the stroller still available for pickup?",
      "readAt": null,
      "createdAt": "2026-10-21T10:05:00.000Z"
    }
  ]
}
```

**Errors**

| Code | Meaning                                       |
| ---- | --------------------------------------------- |
| 400  | Invalid claim ID                              |
| 403  | The user is not the item owner or the claimer |
| 404  | Claim not found                               |

#### Mark Messages as Read

`PATCH /api/claims/:id/messages/read` | Access: Item owner or claimer, CSRF header required

Marks the unread messages that the other person sent on this claim as read. No request body.

**Path parameters**

| Parameter | Type   | Description            |
| --------- | ------ | ---------------------- |
| id        | string | ID (UUID) of the claim |

**Success response (200 OK)**

```json
{
  "success": true,
  "data": { "updatedCount": 2 }
}
```

**Errors**

| Code | Meaning                                       |
| ---- | --------------------------------------------- |
| 400  | Invalid claim ID                              |
| 403  | The user is not the item owner or the claimer |
| 404  | Claim not found                               |
