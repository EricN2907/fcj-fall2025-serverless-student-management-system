package com.example.demo.util;

import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.stereotype.Component;

import java.net.URL;
import java.util.Date;

/**
 * JWT Token Validator cho AWS Cognito
 * Validate signature, expiration, issuer của JWT token
 */
@Component
public class JwtTokenValidator {

    // ⚠️ QUAN TRỌNG: Thay USER_POOL_ID và REGION của bạn vào đây
    // Format: https://cognito-idp.{region}.amazonaws.com/{userPoolId}
    private static final String COGNITO_ISSUER = "https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_UH6X68IKt";
    
    // JWKs URL để lấy public keys từ Cognito (dùng để verify signature)
    private static final String JWKS_URL = COGNITO_ISSUER + "/.well-known/jwks.json";

    // Cache JWKSet để tránh call nhiều lần
    private JWKSet jwkSet;

    /**
     * Validate JWT token (kiểm tra signature, expiration, issuer)
     * @param token JWT token string
     * @return true nếu token hợp lệ, false nếu không
     */
    public boolean validateToken(String token) {
        try {
            // Parse JWT token
            SignedJWT signedJWT = SignedJWT.parse(token);

            // 1. Kiểm tra expiration time
            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
            Date expirationTime = claims.getExpirationTime();
            if (expirationTime == null || expirationTime.before(new Date())) {
                System.out.println("❌ Token đã hết hạn");
                return false;
            }

            // 2. Kiểm tra issuer (phải từ Cognito User Pool của bạn)
            String issuer = claims.getIssuer();
            if (!COGNITO_ISSUER.equals(issuer)) {
                System.out.println("❌ Issuer không hợp lệ: " + issuer);
                return false;
            }

            // 3. Verify signature bằng public key từ Cognito JWKs
            String keyId = signedJWT.getHeader().getKeyID();
            if (!verifySignature(signedJWT, keyId)) {
                System.out.println("❌ Signature không hợp lệ");
                return false;
            }

            System.out.println("✅ Token hợp lệ cho user: " + claims.getSubject());
            return true;

        } catch (Exception e) {
            System.err.println("❌ Lỗi validate token: " + e.getMessage());
            return false;
        }
    }

    /**
     * Extract username (subject/sub claim) từ JWT token
     * @param token JWT token string
     * @return username/userId hoặc null nếu lỗi
     */
    public String extractUsername(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
            return claims.getSubject(); // "sub" claim chứa Cognito User ID
        } catch (Exception e) {
            System.err.println("❌ Không thể extract username: " + e.getMessage());
            return null;
        }
    }

    /**
     * Extract email từ JWT token
     * @param token JWT token string
     * @return email hoặc null nếu không có
     */
    public String extractEmail(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
            return claims.getStringClaim("email");
        } catch (Exception e) {
            System.err.println("❌ Không thể extract email: " + e.getMessage());
            return null;
        }
    }

    /**
     * Extract name từ JWT token
     * @param token JWT token string
     * @return name hoặc null nếu không có
     */
    public String extractName(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
            return claims.getStringClaim("name");
        } catch (Exception e) {
            System.err.println("❌ Không thể extract name: " + e.getMessage());
            return null;
        }
    }

    /**
     * Kiểm tra token đã hết hạn chưa
     * @param token JWT token string
     * @return true nếu đã hết hạn
     */
    public boolean isTokenExpired(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
            Date expirationTime = claims.getExpirationTime();
            
            if (expirationTime == null) {
                return true; // Không có exp claim -> coi như expired
            }
            
            return expirationTime.before(new Date());
        } catch (Exception e) {
            System.err.println("❌ Lỗi kiểm tra expiration: " + e.getMessage());
            return true; // Lỗi parse -> coi như expired
        }
    }

    /**
     * Lấy thời gian còn lại của token (tính bằng giây)
     * @param token JWT token string
     * @return số giây còn lại, hoặc 0 nếu đã hết hạn
     */
    public long getTimeUntilExpiration(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();
            Date expirationTime = claims.getExpirationTime();
            
            if (expirationTime == null) {
                return 0;
            }
            
            long timeLeft = (expirationTime.getTime() - System.currentTimeMillis()) / 1000;
            return Math.max(0, timeLeft);
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * Verify JWT signature bằng public key từ Cognito JWKs
     */
    private boolean verifySignature(SignedJWT signedJWT, String keyId) {
        try {
            // Lấy JWKSet từ Cognito (cache nếu đã load)
            if (jwkSet == null) {
                jwkSet = JWKSet.load(new URL(JWKS_URL));
                System.out.println("✅ Đã tải JWKs từ Cognito");
            }

            // Tìm key theo kid (Key ID) trong JWT header
            JWK jwk = jwkSet.getKeyByKeyId(keyId);
            if (jwk == null) {
                System.err.println("❌ Không tìm thấy key với kid: " + keyId);
                return false;
            }

            // Convert JWK sang RSAKey và tạo verifier
            RSAKey rsaKey = (RSAKey) jwk;
            JWSVerifier verifier = new RSASSAVerifier(rsaKey.toRSAPublicKey());

            // Verify signature
            return signedJWT.verify(verifier);

        } catch (Exception e) {
            System.err.println("❌ Lỗi verify signature: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Extract tất cả claims từ token (dùng cho debugging)
     */
    public JWTClaimsSet extractAllClaims(String token) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            return signedJWT.getJWTClaimsSet();
        } catch (Exception e) {
            System.err.println("❌ Lỗi extract claims: " + e.getMessage());
            return null;
        }
    }
}
