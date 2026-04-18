package com.experimental.gallery

import androidx.lifecycle.ViewModel
import androidx.compose.runtime.mutableStateListOf

data class GalleryPhoto(
    val id: String,
    val path: String,
    val dateAdded: Long
)

class MainViewModel : ViewModel() {
    val photos = mutableStateListOf<GalleryPhoto>()

    fun loadPhotos() {
        // Here we will implement MediaStore scanning in Kotlin
    }
}
