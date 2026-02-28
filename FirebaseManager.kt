package com.mazei97.newremnant.data

import android.app.Activity
import android.content.Context
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
import com.mazei97.newremnant.control.MainActivity
import com.mazei97.newremnant.resetActivity
import com.mazei97.newremnant.toast

object FirebaseManager {
    val KEYS = listOf("id", "사진", "이름", "성별", "생년월일", "구분", "등록일자", "교구", "연락처1", "연락처2", "주소", "교육1차", "교육2차", "교육3차", "등반", "인수교사", "메모")
    private const val ACCOUNT = "remnant@iyewon.org"

    var user: FirebaseUser? = null
    var update: Boolean = true

    fun login(activity: Activity, password: String) {
        val auth = FirebaseAuth.getInstance()
        auth.signInWithEmailAndPassword(ACCOUNT, password)
            .addOnCompleteListener {
                if (it.isSuccessful) {
                    user = auth.currentUser
                    val sharedPreferences = activity.getSharedPreferences("new_remnant", Context.MODE_PRIVATE)
                    sharedPreferences.edit().putString("activation_code", password).apply()
                    activity.resetActivity<MainActivity>()
                } else {
                    activity.toast("비밀번호를 확인하세요")
                }
            }
    }

    fun load(callback: (data: List<Map<String, String>>?) -> Unit) {
        FirebaseFirestore.getInstance().collection("member")
            .get()
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    update = false
                    val result = task.result.documents
                    val data = result.map { document ->
                        val remnant = mutableMapOf<String, String>()
                        KEYS.forEach { key ->
                            remnant[key] = document.getString(key) ?: ""
                        }
                        remnant
                    }

                    callback(data)
                } else {
                    callback(null)
                }
            }
    }

    fun save(data: Map<String, String>, callback: (result: Boolean) -> Unit) {
        FirebaseFirestore.getInstance()
            .collection("member")
            .document(data["id"]!!)
            .set(data)
            .addOnCompleteListener {
                update = true
                callback(it.isSuccessful)
            }
    }

    fun remove(documentId: String, photoName: String, callback: () -> Unit) {
        FirebaseFirestore.getInstance()
            .collection("member")
            .document(documentId)
            .delete()
            .addOnCompleteListener {
                update = true
                removePhoto(photoName, callback)
            }
    }

    fun removePhoto(photoName: String, callback: () -> Unit) {
        if (photoName.startsWith("remote://")) {
            FirebaseStorage.getInstance()
                .reference
                .child(photoName.substring(9))
                .delete()
                .addOnCompleteListener {
                    update = true
                    callback()
                }
        } else {
            callback()
        }
    }
}