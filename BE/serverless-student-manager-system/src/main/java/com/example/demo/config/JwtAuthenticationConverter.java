package com.example.demo.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public class JwtAuthenticationConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        List<GrantedAuthority> authorities = new ArrayList<>();



        // ✅ CÁCH MỚI: Lấy Role từ Cognito Group
        // Token sẽ có dạng: "cognito:groups": ["Admin", "User"]
        List<String> groups = jwt.getClaimAsStringList("cognito:groups");

        if (groups != null) {
            for (String group : groups) {
                // Convert: "Admin" -> "ROLE_ADMIN"
                // Convert: "Student" -> "ROLE_STUDENT"
                authorities.add(new SimpleGrantedAuthority("ROLE_" + group.toUpperCase()));
            }
        }

        return authorities;
    }
}