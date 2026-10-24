# Flutter Wrapper
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.**  { *; }
-keep class io.flutter.plugins.**  { *; }

# Keep models and serialized classes if needed
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
-dontwarn io.flutter.**

# Razorpay Checkout SDK & Flutter Plugin
-keepattributes *Annotation*
-keepattributes JavascriptInterface
-dontwarn com.razorpay.**
-keep class com.razorpay.** { *; }
-keep interface com.razorpay.** { *; }
-keep class com.razorpay.CheckoutActivity { *; }
-keep class com.razorpay.Razorpay { *; }
-keep class com.razorpay.razorpay_flutter.** { *; }
-optimizations !method/inlining/
-keepclasseswithmembers class * {
  public void onPayment*(...);
}
-keepclasseswithmembers class * {
  public void onPaymentSuccess(java.lang.String);
  public void onPaymentError(int, java.lang.String);
}
-keepclasseswithmembers class * {
  public void onPaymentSuccess(java.lang.String, com.razorpay.PaymentData);
  public void onPaymentError(int, java.lang.String, com.razorpay.PaymentData);
}

# Google Play Services & dependencies used by Razorpay
-dontwarn com.google.android.gms.**
-keep class com.google.android.gms.** { *; }
