package com.example.demo.dto.Post;

import lombok.Data;

@Data
public class ReactionRequest {
    private String entityId;   // POST#123 or COMMENT#456
    private String entityType; // POST or COMMENT
    private String action;     // add | remove
}
