
#### Mark Item as Picked Up

**Method:** PATCH  
**Path:** `/api/items/:id/picked-up`  
**Access:** Item owner (proposed)

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| id | string | ID of the item; type TBD |

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

| Code | Meaning |
|---|---|
| 400 | Invalid item ID or request |
| 401 | User is not signed in |
| 403 | User is not allowed to update this item |
| 404 | Item not found |
| 409 | Item cannot be marked as picked up in its current state |
| 500 | Internal server error |

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

| Code | Meaning |
|---|---|
| 401 | User is not signed in |
| 500 | Internal server error |

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

| Code | Meaning |
|---|---|
| 401 | User is not signed in |
| 500 | Internal server error |

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

| Code | Meaning |
|---|---|
| 401 | User is not signed in |
| 500 | Internal server error |

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

| Parameter | Type | Description |
|---|---|---|
| id | string | ID of the claim; type TBD |

**Request Body (proposed)**

| Field | Type | Validation |
|---|---|---|
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

| Code | Meaning |
|---|---|
| 400 | Invalid message content |
| 401 | User is not signed in |
| 403 | User is not allowed to message about this claim |
| 404 | Claim not found |
| 500 | Internal server error |

**Security**

The request must include the `X-CSRF-TOKEN` header.

Only authorized participants in the claim should be able to send messages (proposed).

**Note:** Request fields, message length limits, response fields, access rules, and error cases must be confirmed with the backend team.

#### Get Messages

**Method:** GET  
**Path:** `/api/claims/:id/messages`  
**Access:** Item owner or claimer (proposed)

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| id | string | ID of the claim; type TBD |

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

| Code | Meaning |
|---|---|
| 400 | Invalid claim ID |
| 401 | User is not signed in |
| 403 | User is not authorized to view these messages |
| 404 | Claim not found |
| 500 | Internal server error |

**Security**

Only authorized participants in the claim should be able to view messages.

**Note:** Response fields, access rules, and error cases must be confirmed with the backend team.

#### Mark Messages as Read

**Method:** PATCH  
**Path:** `/api/claims/:id/messages/read`  
**Access:** Item owner or claimer (proposed)

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| id | string | ID of the claim; type TBD |

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

| Code | Meaning |
|---|---|
| 400 | Invalid claim ID or request |
| 401 | User is not signed in |
| 403 | User is not authorized to update these messages |
| 404 | Claim not found |
| 500 | Internal server error |

**Security**

The request must include the `X-CSRF-TOKEN` header.

Only authorized claim participants should be allowed to mark messages addressed to them as read (proposed).

**Note:** The request body, response fields, access rules, and error cases must be confirmed with the backend team.


