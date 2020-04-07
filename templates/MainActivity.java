package com.rnktest8;
import com.rna.core.RNKActivity;

public class MainActivity extends RNKActivity {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "rnktest8";
  }
}
