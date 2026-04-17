package com.petshop.util;

public final class SlugUtil {

    private SlugUtil() {}

    public static String toSlug(String input) {
        if (input == null) return "";
        String result = input.trim().toLowerCase();
        result = result
                .replace('ş', 's').replace('ç', 'c').replace('ğ', 'g')
                .replace('ü', 'u').replace('ö', 'o').replace('ı', 'i')
                .replace('İ', 'i').replace('Ş', 's').replace('Ç', 'c')
                .replace('Ğ', 'g').replace('Ü', 'u').replace('Ö', 'o');
        result = result.replaceAll("[^a-z0-9\\s-]", "");
        result = result.replaceAll("[\\s]+", "-");
        result = result.replaceAll("-{2,}", "-");
        result = result.replaceAll("^-|-$", "");
        return result;
    }
}
