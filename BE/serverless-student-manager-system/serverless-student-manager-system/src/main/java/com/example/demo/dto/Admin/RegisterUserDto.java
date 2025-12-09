package com.example.demo.dto.Admin;

import lombok.Data;

import java.util.Date;
@Data
public class RegisterUserDto {
    private String email ;
    private String password ;
    private String name ;
    private int role_id ;
    private String codeUser ;
    private String DOB ;
}
