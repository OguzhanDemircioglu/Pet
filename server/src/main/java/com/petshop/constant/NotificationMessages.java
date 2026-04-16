package com.petshop.constant;

public enum NotificationMessages {
    NOT_FOUND("Bildirim bulunamadı");

    private final String message;
    NotificationMessages(String message) { this.message = message; }
    public String get() { return message; }
}
