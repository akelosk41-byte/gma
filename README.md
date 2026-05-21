# Minecraft 3D — Android APK

Простая 3D-игра в стиле Minecraft в виде Android-приложения.

- Бесконечный воксельный мир с процедурной генерацией (трава, земля, камень, песок, деревья).
- Управление: джойстик слева, обзор пальцем справа, кнопки прыжка / разрушения / постановки блока.
- 8 типов блоков в хотбаре (трава, земля, камень, дерево, доски, кирпич, стекло, листва).
- Pointer-lock + WASD для запуска на ПК (внутри WebView запускается тот же движок).

## Установка APK на телефон

1. Скачай файл [`dist/Minecraft3D-debug.apk`](dist/Minecraft3D-debug.apk).
2. На телефоне разреши установку из неизвестных источников (Настройки → Безопасность).
3. Открой `.apk` файл и нажми «Установить».
4. Запусти «Minecraft 3D» с рабочего стола.

> Минимальная версия Android: **6.0 (API 23)**, целевая — Android 14 (API 34).

## Сборка APK из исходников

Требуется JDK 17 и Android SDK (build-tools 34, platform 34).

```bash
cd android
echo "sdk.dir=/path/to/android-sdk" > local.properties
./gradlew :app:assembleDebug
# APK будет в android/app/build/outputs/apk/debug/app-debug.apk
```

## Структура

```
android/                     # Android Gradle проект
├── app/
│   ├── build.gradle.kts
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/akelosk41/minecraft3d/MainActivity.kt
│       ├── assets/
│       │   ├── index.html        # сам движок игры (Three.js + воксельный мешер)
│       │   └── three.min.js      # библиотека Three.js (вендорится в APK)
│       └── res/
├── build.gradle.kts
├── settings.gradle.kts
└── gradlew
dist/
└── Minecraft3D-debug.apk    # готовый APK для установки
```
