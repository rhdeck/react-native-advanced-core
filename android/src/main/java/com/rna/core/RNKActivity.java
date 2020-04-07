package com.rna.core;
import android.os.Bundle;
import com.facebook.react.ReactActivity;
import java.util.Map;
import java.util.HashMap;
public class RNKActivity extends ReactActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        RNKRegistry.instance.trigger("activity.create", this);
    }
}