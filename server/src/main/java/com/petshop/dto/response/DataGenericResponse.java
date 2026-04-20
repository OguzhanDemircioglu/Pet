package com.petshop.dto.response;

import com.petshop.constant.ResponseMessages;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class DataGenericResponse<T> extends GenericResponse {
    private T data;

    public static <T> DataGenericResponse<T> of(T data) {
        DataGenericResponse<T> r = new DataGenericResponse<>();
        r.setSuccess(true);
        r.setMessage(ResponseMessages.SUCCESS.get());
        r.setData(data);
        return r;
    }
}
