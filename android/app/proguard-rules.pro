# Keep WebView JS interface methods if added in the future
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
