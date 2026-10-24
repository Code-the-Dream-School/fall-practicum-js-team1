# Baby Gear Exchange API Documentation

This document describes the proposed API endpoints for the Baby Gear Exchange application.

### Authentication Endpoints

#### Register User

**Method:** POST  
**Path:** `/api/users/register`  
**Access:** Public

**Query Parameters**

None.

**Request Body**

| Field    | Type   | Validation                                                                                          |
| -------- | ------ | --------------------------------------------------------------------------------------------------- |
| name     | string | Required, 2–50 characters                                                                           |
| email    | string | Required, valid email address                                                                       |
| password | string | Required, minimum 8 characters, at least one uppercase letter, one lowercase letter, and one number |

**Example Request**

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "Password123"
}
```

**Success Response (proposed)**

```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "Jane Smith",
    "email": "jane@example.com"
  }
}
```

**Possible Errors**

| Code | Meaning                          |
| ---- | -------------------------------- |
| 400  | Invalid name, email, or password |
| 409  | Email already registered         |
| 500  | Internal server error            |

**Security**

The request must include the `X-CSRF-TOKEN` header.

Never return the user's password in the response.

**Note:** Response fields, ID type, and error cases must be confirmed with the backend team.

#### Log In User

**Method:** POST  
**Path:** `/api/users/logon`  
**Access:** Public

**Query Parameters**

None.

**Request Body**

| Field    | Type   | Validation                    |
| -------- | ------ | ----------------------------- |
| email    | string | Required; valid email address |
| password | string | Required                      |

**Example Request**

```json
{
  "email": "jane@example.com",
  "password": "Password123"
}
```

**Success Response (proposed)**

```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "Jane Smith",
    "email": "jane@example.com"
  }
}
```

**Possible Errors**

| Code | Meaning                   |
| ---- | ------------------------- |
| 400  | Missing or invalid input  |
| 401  | Invalid email or password |
| 500  | Internal server error     |

**Security**

The request must include the `X-CSRF-TOKEN` header.

Authentication uses cookies. The exact cookie and CSRF token handling must be confirmed with the backend team.

**Note:** The response fields and error cases are proposed and must be confirmed with the backend team.

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

| Code | Meaning               |
| ---- | --------------------- |
| 401  | User is not signed in |
| 500  | Internal server error |

**Security**

The request must include the `X-CSRF-TOKEN` header.

The server should clear the user's authentication cookie.

**Note:** The success response, cookie handling, and error cases must be confirmed with the backend team.

#### Get Current User

**Method:** GET  
**Path:** `/api/users/me`  
**Access:** Signed-in users

**Query Parameters**

None.

**Request Body**

None.

**Success Response (proposed)**

```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "Jane Smith",
    "email": "jane@example.com"
  }
}
```

**Possible Errors**

| Code | Meaning               |
| ---- | --------------------- |
| 401  | User is not signed in |
| 500  | Internal server error |

**Security**

Uses the user's authentication cookie. A CSRF header is not required for this read-only GET request.

Never return the user's password.

**Note:** Response fields, ID type, and error cases must be confirmed with the backend team.

### Categories Endpoints

#### Get Categories

**Method:** GET  
**Path:** `/api/categories`  
**Access:** Public

**Query Parameters**

None.

**Request Body**

None.

**Success Response (proposed)**

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Strollers"
    },
    {
      "id": "2",
      "name": "Clothing"
    }
  ]
}
```

**Possible Errors**

| Code | Meaning               |
| ---- | --------------------- |
| 500  | Internal server error |

**Security**

No authentication required.

**Note:** Category names, response fields, ID types, and error cases must be confirmed with the backend team.

### Addresses Endpoints

#### Get Addresses

**Method:** GET  
**Path:** `/api/addresses`  
**Access:** Signed-in users (proposed)

**Query Parameters**

None proposed.

**Request Body**

None.

**Success Response (proposed)**

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "city": "San Rafael",
      "state": "CA"
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

Uses the user's authentication cookie.

Only return addresses the signed-in user is authorized to view. Do not expose other users' private pickup addresses.

**Note:** Address fields, access rules, response fields, and error cases must be confirmed with the backend team.

#### Create Address

**Method:** POST  
**Path:** `/api/addresses`  
**Access:** Signed-in users (proposed)

**Query Parameters**

None.

**Request Body (proposed)**

| Field   | Type   | Validation           |
| ------- | ------ | -------------------- |
| street  | string | Required; length TBD |
| city    | string | Required; length TBD |
| state   | string | Required; format TBD |
| zipCode | string | Required; format TBD |

**Example Request**

```json
{
  "street": "123 Example Street",
  "city": "San Rafael",
  "state": "CA",
  "zipCode": "94901"
}
```

**Success Response (proposed)**

```json
{
  "success": true,
  "data": {
    "id": "1",
    "city": "San Rafael",
    "state": "CA"
  }
}
```

**Possible Errors**

| Code | Meaning                           |
| ---- | --------------------------------- |
| 400  | Missing or invalid address fields |
| 401  | User is not signed in             |
| 500  | Internal server error             |

**Security**

The request must include the `X-CSRF-TOKEN` header.

The address must belong to the signed-in user. Do not expose private pickup addresses to unauthorized users.

**Note:** Request fields, validation limits, response fields, and access rules must be confirmed with the backend team.

### Items Endpoints

#### Get Items

**Method:** GET  
**Path:** `/api/items`  
**Access:** Public (proposed)

**Query Parameters**

| Parameter | Type   | Description              |
| --------- | ------ | ------------------------ |
| q         | string | Optional search text     |
| category  | string | Optional category filter |
| condition | string | Optional item condition  |
| ageMin    | number | Optional minimum age     |
| ageMax    | number | Optional maximum age     |
| city      | string | Optional city filter     |

**Request Body**

None.

**Success Response (proposed)**

```json
{
  "success": true,
  "data": [
    {
      "id": "10",
      "title": "Baby Stroller",
      "category": "Strollers",
      "condition": "Good",
      "city": "San Rafael"
    }
  ]
}
```

**Possible Errors**

| Code | Meaning                  |
| ---- | ------------------------ |
| 400  | Invalid query parameters |
| 500  | Internal server error    |

**Security**

Do not include private pickup addresses in public item listings.

**Note:** Query parameter types, filter behavior, response fields, and error cases must be confirmed with the backend team.

#### Get Item Details

**Method:** GET  
**Path:** `/api/items/:id`  
**Access:** Public (proposed)

**Path Parameters**

| Parameter | Type   | Description              |
| --------- | ------ | ------------------------ |
| id        | string | ID of the item; type TBD |

**Query Parameters**

None.

**Request Body**

None.

**Success Response (proposed)**

```json
{
  "success": true,
  "data": {
    "id": "10",
    "title": "Baby Stroller",
    "description": "A gently used baby stroller.",
    "category": "Strollers",
    "condition": "Good",
    "city": "San Rafael",
    "status": "available"
  }
}
```

**Possible Errors**

| Code | Meaning               |
| ---- | --------------------- |
| 400  | Invalid item ID       |
| 404  | Item not found        |
| 500  | Internal server error |

**Security**

Do not include the private pickup address in the public response.

Pickup address information should only be available to the item owner or approved claimer through an authorized response.

**Note:** Response fields, ID type, access rules, and error cases must be confirmed with the backend team.

#### Create Item

**Method:** POST  
**Path:** `/api/items`  
**Access:** Signed-in users

**Query Parameters**

None.

**Request Body (proposed)**

| Field       | Type             | Validation                                        |
| ----------- | ---------------- | ------------------------------------------------- |
| title       | string           | Required; length TBD                              |
| description | string           | Required; length TBD                              |
| categoryId  | string           | Required; valid category ID                       |
| condition   | string           | Required; allowed values TBD                      |
| ageMin      | number           | Optional; minimum age                             |
| ageMax      | number           | Optional; maximum age                             |
| addressId   | string           | Required; valid address belonging to user         |
| photos      | array of strings | Optional; Cloudinary image references, limits TBD |

**Example Request (proposed)**

```json
{
  "title": "Baby Stroller",
  "description": "A gently used baby stroller.",
  "categoryId": "1",
  "condition": "Good",
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

**Photo Uploads**

Cloudinary upload flow is TBD. Confirm whether images are uploaded directly from the browser or through the backend API.

**Note:** Request fields, validation limits, photo handling, response fields, and error cases must be confirmed with the backend team.

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

No request body is proposed. Confirm with the backend team.

**Success Response (proposed)**

```json
{
  "success": true,
  "data": {
    "id": "20",
    "itemId": "10",
    "status": "requested"
  }
}
```

**Possible Errors**

| Code | Meaning                                |
| ---- | -------------------------------------- |
| 400  | Invalid item ID or request             |
| 401  | User is not signed in                  |
| 403  | User is not allowed to claim this item |
| 404  | Item not found                         |
| 409  | Item is unavailable or already claimed |
| 500  | Internal server error                  |

**Security**

The request must include the `X-CSRF-TOKEN` header.

Only signed-in users can submit claims. The server should prevent users from claiming their own items and enforce claim eligibility rules (proposed).

**Note:** Claim eligibility, request body, status values, response fields, and error cases must be confirmed with the backend team.

#### Get Item Claims

**Method:** GET  
**Path:** `/api/items/:id/claims`  
**Access:** Item owner (proposed)

**Path Parameters**

| Parameter | Type   | Description              |
| --------- | ------ | ------------------------ |
| id        | string | ID of the item; type TBD |

**Query Parameters**

None proposed.

**Request Body**

None.

**Success Response (proposed)**

```json
{
  "success": true,
  "data": [
    {
      "id": "20",
      "itemId": "10",
      "status": "requested"
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
**Access:** Item owner (proposed)

**Path Parameters**

| Parameter | Type   | Description               |
| --------- | ------ | ------------------------- |
| id        | string | ID of the claim; type TBD |

**Query Parameters**

None.

**Request Body (proposed)**

| Field  | Type   | Validation                                                |
| ------ | ------ | --------------------------------------------------------- |
| status | string | Required; allowed values proposed: `approved`, `declined` |

**Example Request (proposed)**

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

| Parameter | Type   | Description               |
| --------- | ------ | ------------------------- |
| id        | string | ID of the claim; type TBD |

**Query Parameters**

None.

**Request Body**

No request body is proposed. Confirm with the backend team.

**Success Response (proposed)**

```json
{
  "success": true,
  "data": {
    "id": "20",
    "status": "cancelled"
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

| Parameter | Type   | Description               |
| --------- | ------ | ------------------------- |
| id        | string | ID of the claim; type TBD |

**Query Parameters**

None.

**Request Body**

No request body is proposed. Confirm with the backend team.

**Success Response (proposed)**

```json
{
  "success": true,
  "data": {
    "id": "20",
    "status": "no-show"
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

| Parameter | Type   | Description              |
| --------- | ------ | ------------------------ |
| id        | string | ID of the item; type TBD |

**Request Body**

No request body is proposed. Confirm with the backend team.

**Success Response (proposed)**

```json
{
  "success": true,
  "data": {
    "id": "10",
    "status": "picked-up"
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
      "id": "10",
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
      "id": "1",
      "itemId": "10",
      "status": "requested"
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
- `waitingForYou`: Donations waiting for owner action
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

| Parameter | Type   | Description               |
| --------- | ------ | ------------------------- |
| id        | string | ID of the claim; type TBD |

**Request Body (proposed)**

| Field   | Type   | Validation                               |
| ------- | ------ | ---------------------------------------- |
| content | string | Required; minimum and maximum length TBD |

**Example Request**

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

| Parameter | Type   | Description               |
| --------- | ------ | ------------------------- |
| id        | string | ID of the claim; type TBD |

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

| Parameter | Type   | Description               |
| --------- | ------ | ------------------------- |
| id        | string | ID of the claim; type TBD |

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
