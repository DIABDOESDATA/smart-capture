package com.diabdoesdata.smartcapture

import android.content.Context
import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName="sessions")
data class Session(@PrimaryKey val id:String,val body:String="sedan",val vehicle:String="{}",val sequence:String="[]",val cursor:Int=0,val demo:Boolean=false,val createdAt:Long=System.currentTimeMillis())

/** Durable journal: a published image is never removed as a side effect of retry/retake. */
@Entity(tableName="photos",indices=[Index("sessionId"),Index("state")])
data class Photo(@PrimaryKey val id:String,val sessionId:String?,val shot:String,val shotIndex:Int,val tempPath:String,
    val displayName:String,val metadata:String,val capturedAt:Long,val state:String="capturing",val uri:String?=null,
    val width:Int=0,val height:Int=0,val bytes:Long=0,val elapsedMs:Long=0,val source:String="camera",val error:String?=null)

@Entity(tableName="reference_overrides")
data class ReferenceOverride(@PrimaryKey val key:String,val path:String?=null,val calibration:String="{}")

@Dao interface CaptureDao {
    @Query("SELECT * FROM sessions ORDER BY createdAt DESC") fun sessions():Flow<List<Session>>
    @Query("SELECT * FROM sessions WHERE id=:id") suspend fun session(id:String):Session?
    @Upsert suspend fun putSession(session:Session)
    @Query("SELECT * FROM photos ORDER BY capturedAt DESC") fun photos():Flow<List<Photo>>
    @Query("SELECT * FROM photos WHERE state != 'saved' AND source='camera'") suspend fun unfinished():List<Photo>
    @Query("SELECT * FROM photos WHERE id=:id") suspend fun photo(id:String):Photo?
    @Upsert suspend fun putPhoto(photo:Photo)
    @Query("SELECT * FROM reference_overrides WHERE `key`=:key") suspend fun reference(key:String):ReferenceOverride?
    @Upsert suspend fun putReference(reference:ReferenceOverride)
}

@Database(entities=[Session::class,Photo::class,ReferenceOverride::class],version=1,exportSchema=true)
abstract class CaptureDatabase:RoomDatabase() {
    abstract fun dao():CaptureDao
    companion object {
        @Volatile private var instance:CaptureDatabase?=null
        fun get(context:Context):CaptureDatabase=instance ?: synchronized(this) {
            instance ?: Room.databaseBuilder(context.applicationContext,CaptureDatabase::class.java,"smartcapture-native-v3.db").build().also { instance=it }
        }
    }
}
