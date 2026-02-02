# Security Updates

This document tracks security enhancements and changes made to protect user data and prevent unauthorized access.

## February 2, 2026 - Inquiry Endpoint PII Protection

### Issue

The `/api/listings/:id/inquiry` endpoint was exposing seller Personally Identifiable Information (PII) - specifically `sellerPhone` and `sellerName` - to unauthenticated users. This created several security and privacy risks:

1. **Mass Scraping**: Unauthenticated users could scrape seller contact information from all listings
2. **Spam/Harassment**: Sellers could receive unwanted contact from anonymous parties
3. **Privacy Violations**: Potential GDPR and data protection compliance issues
4. **No Audit Trail**: No way to track who accessed seller contact information

### Solution

Modified the inquiry endpoint to **require authentication** before returning seller contact details:

#### Controller Changes (`backend/src/controllers/listing.controller.ts`)

- Added authentication check using `req.user`
- Throws `401 Unauthorized` error if user is not authenticated
- Added validation to prevent sellers from inquiring about their own listings
- Added logging to track authenticated inquiry requests
- Maintained `incrementInquiry()` call to track legitimate interest
- Added comprehensive JSDoc documentation explaining security rationale

#### Route Changes (`backend/src/routes/listing.routes.ts`)

- Applied `authenticate` middleware to the inquiry route
- Updated route documentation to reflect new access level: `Private`

### Security Benefits

1. **PII Protection**: Seller contact information only accessible to authenticated users
2. **Audit Trail**: All inquiries are now logged with the requester's phone number
3. **Accountability**: Users must be logged in, creating accountability for their actions
4. **Prevention of Mass Scraping**: Authentication requirement makes bulk scraping impractical
5. **Self-Inquiry Prevention**: Sellers cannot inquire about their own listings

### What Still Works

- `Listing.incrementInquiry()` continues to track inquiry counts
- Authenticated users can still access seller contact information
- The response format remains unchanged (backward compatible for authenticated clients)

### Breaking Change Notice

⚠️ **BREAKING CHANGE**: The `/api/listings/:id/inquiry` endpoint now requires authentication.

**Before:**

```bash
# Public access - NO authentication required
POST /api/listings/:id/inquiry
```

**After:**

```bash
# Private access - Authentication token REQUIRED
POST /api/listings/:id/inquiry
Authorization: Bearer <token>
```

**Error Response (Unauthenticated):**

```json
{
  "success": false,
  "error": "Authentication required to access seller contact information"
}
```

**Error Response (Self-Inquiry):**

```json
{
  "success": false,
  "error": "Cannot inquire about your own listing"
}
```

### Recommended Additional Security Measures

For further hardening, consider implementing:

1. **Rate Limiting**: Add rate limiting middleware to prevent abuse by authenticated users

   ```typescript
   router.post(
     '/:id/inquiry',
     authenticate,
     rateLimiter({ max: 10, windowMs: 60000 }),
     sendInquiry
   );
   ```

2. **CAPTCHA Protection**: Implement CAPTCHA verification for inquiry requests

   ```typescript
   router.post('/:id/inquiry', authenticate, verifyCaptcha, sendInquiry);
   ```

3. **Inquiry History Tracking**: Store inquiry history to detect suspicious patterns

   ```typescript
   // Track in database which users inquired about which listings
   await InquiryLog.create({ user: user._id, listing: listing._id, timestamp: Date.now() });
   ```

4. **Email Verification**: Require email verification before allowing inquiries
5. **Cooldown Period**: Implement cooldown between inquiries from the same user

### Testing Updates Required

Update your tests to include authentication tokens when testing the inquiry endpoint:

```typescript
// BEFORE
const response = await request(app).post('/api/listings/123/inquiry').send({});

// AFTER
const response = await request(app)
  .post('/api/listings/123/inquiry')
  .set('Authorization', `Bearer ${authToken}`)
  .send({});
```

### Migration Guide for Frontend

If your frontend currently allows unauthenticated users to send inquiries:

1. **Update UI**: Only show "Send Inquiry" button to authenticated users
2. **Add Authentication Flow**: Prompt users to log in/register before sending inquiries
3. **Update API Calls**: Include authentication headers in inquiry requests
4. **Handle 401 Errors**: Redirect to login page when inquiry fails due to authentication

Example React implementation:

```jsx
const handleInquiry = async (listingId) => {
  if (!isAuthenticated) {
    // Redirect to login
    navigate('/login', { state: { from: `/listings/${listingId}` } });
    return;
  }

  try {
    const response = await api.post(
      `/listings/${listingId}/inquiry`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    // Handle success
  } catch (error) {
    if (error.response?.status === 401) {
      // Handle authentication error
      navigate('/login');
    }
  }
};
```

---

## Additional Security Enhancements in This Release

### Input Sanitization

- Added field allowlisting for `createListing` and `updateListing` endpoints
- Prevents users from setting sensitive fields like `status`, `seller`, etc.
- Forced `status: 'pending'` for new listings to prevent privilege escalation

### Price Validation

- Added `isNaN()` checks for price range filters to prevent undefined behavior
- Removes empty price query objects to avoid database errors

### Regex Security

- Added `escapeRegex()` function to prevent ReDoS attacks in search queries
- Applied to location, brand, and other text search fields

### Sort Parameter Validation

- Implemented allowlist-based validation for sort fields and directions
- Prevents NoSQL injection through sort parameters
