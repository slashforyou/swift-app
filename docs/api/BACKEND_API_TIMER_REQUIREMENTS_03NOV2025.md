# 🔧 Modifications API Backend - Timer Synchronization (3 Nov 2025)

## 🎯 Objectif

Permettre à l'app mobile de **synchroniser l'état du timer** vers le backend afin que l'API puisse :
- Connaître le temps réel passé sur chaque job
- Historiser les temps par étape (step)
- Calculer le temps facturable (billable hours)
- Fournir des rapports précis

---

## 📊 État Actuel vs État Cible

### ❌ Problème Actuel

**App Mobile :**
- Timer démarré : 442h enregistrées dans localStorage
- Step actuel : 2
- Historique des steps avec durées
- Pauses/breaks enregistrées

**API Backend :**
```json
{
  "job": {
    "current_step": 2,
    "created_at": "2025-10-11T06:02:13.000Z",
    "updated_at": "2025-10-11T06:02:13.000Z"  // ❌ Jamais mis à jour !
  },
  "timeline": {
    "total_duration_hours": 555,  // ❌ Temps depuis création, pas temps actif
    "time_in_current_step_hours": 555
  }
}
```

**Manque :**
- ❌ Temps réel du timer (442h)
- ❌ Historique des steps avec durées
- ❌ Temps de pause (breaks)
- ❌ Temps facturable
- ❌ Timestamps de début/fin par step

---

### ✅ État Cible

**API Backend devrait retourner :**
```json
{
  "job": {
    "current_step": 2,
    "created_at": "2025-10-11T06:02:13.000Z",
    "updated_at": "2025-10-28T10:30:00.000Z"  // ✅ Mis à jour à chaque sync
  },
  "timeline": {
    "total_duration_hours": 555,              // Temps depuis création (inchangé)
    "total_billable_hours": 442,              // ✅ NOUVEAU: Temps actif du timer
    "total_break_hours": 12,                  // ✅ NOUVEAU: Temps de pause
    "timer_is_running": false,                // ✅ NOUVEAU: Timer en cours ou non
    "step_history": [                         // ✅ NOUVEAU: Historique détaillé
      {
        "step": 1,
        "step_name": "Préparation",
        "started_at": "2025-10-11T06:02:13.000Z",
        "completed_at": "2025-10-11T08:30:00.000Z",
        "duration_hours": 2.5,
        "break_hours": 0.5
      },
      {
        "step": 2,
        "step_name": "En route",
        "started_at": "2025-10-11T08:30:00.000Z",
        "completed_at": null,                 // En cours
        "duration_hours": 439.5,
        "break_hours": 11.5
      }
    ]
  }
}
```

---

## 🗄️ Modifications Base de Données

### 1. Ajouter colonnes à la table `jobs`

```sql
ALTER TABLE jobs ADD COLUMN timer_total_hours DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE jobs ADD COLUMN timer_billable_hours DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE jobs ADD COLUMN timer_break_hours DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE jobs ADD COLUMN timer_is_running BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN timer_started_at TIMESTAMP NULL;
ALTER TABLE jobs ADD COLUMN timer_last_updated TIMESTAMP NULL;
```

**Migration Laravel :**
```php
// database/migrations/2025_11_03_create_job_timer_columns.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('jobs', function (Blueprint $table) {
            $table->decimal('timer_total_hours', 10, 2)->default(0)->after('current_step');
            $table->decimal('timer_billable_hours', 10, 2)->default(0)->after('timer_total_hours');
            $table->decimal('timer_break_hours', 10, 2)->default(0)->after('timer_billable_hours');
            $table->boolean('timer_is_running')->default(false)->after('timer_break_hours');
            $table->timestamp('timer_started_at')->nullable()->after('timer_is_running');
            $table->timestamp('timer_last_updated')->nullable()->after('timer_started_at');
        });
    }

    public function down(): void
    {
        Schema::table('jobs', function (Blueprint $table) {
            $table->dropColumn([
                'timer_total_hours',
                'timer_billable_hours',
                'timer_break_hours',
                'timer_is_running',
                'timer_started_at',
                'timer_last_updated'
            ]);
        });
    }
};
```

---

### 2. Créer table `job_step_history`

```sql
CREATE TABLE job_step_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_id BIGINT UNSIGNED NOT NULL,
    step INT NOT NULL,
    step_name VARCHAR(255),
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NULL,
    duration_hours DECIMAL(10, 2) DEFAULT 0,
    break_hours DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    INDEX idx_job_id (job_id),
    INDEX idx_step (step)
);
```

**Migration Laravel :**
```php
// database/migrations/2025_11_03_create_job_step_history_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_step_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained('jobs')->onDelete('cascade');
            $table->integer('step');
            $table->string('step_name')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->decimal('duration_hours', 10, 2)->default(0);
            $table->decimal('break_hours', 10, 2)->default(0);
            $table->timestamps();
            
            $table->index('job_id');
            $table->index('step');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_step_history');
    }
};
```

---

### 3. Créer table `job_timer_events` (optionnel, pour audit)

Pour un suivi détaillé de tous les événements du timer (start, pause, resume, stop).

```sql
CREATE TABLE job_timer_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_id BIGINT UNSIGNED NOT NULL,
    event_type ENUM('start', 'pause', 'resume', 'stop', 'step_advance') NOT NULL,
    current_step INT,
    elapsed_ms BIGINT,
    break_ms BIGINT,
    event_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    INDEX idx_job_id (job_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
);
```

**Migration Laravel :**
```php
// database/migrations/2025_11_03_create_job_timer_events_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_timer_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_id')->constrained('jobs')->onDelete('cascade');
            $table->enum('event_type', ['start', 'pause', 'resume', 'stop', 'step_advance']);
            $table->integer('current_step')->nullable();
            $table->bigInteger('elapsed_ms')->default(0);
            $table->bigInteger('break_ms')->default(0);
            $table->json('event_data')->nullable();
            $table->timestamp('created_at')->useCurrent();
            
            $table->index('job_id');
            $table->index('event_type');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_timer_events');
    }
};
```

---

## 🔌 Nouveaux Endpoints API

### 1. Synchroniser l'état du timer

**Endpoint :** `PUT /api/v1/jobs/{id}/timer`

**Utilisation :** L'app appelle cet endpoint à chaque changement d'état du timer.

**Request Body :**
```json
{
  "current_step": 2,
  "total_elapsed_hours": 442.5,
  "total_break_hours": 12.0,
  "billable_hours": 430.5,
  "is_running": false,
  "step_history": [
    {
      "step": 1,
      "step_name": "Préparation",
      "started_at": "2025-10-11T06:02:13.000Z",
      "completed_at": "2025-10-11T08:30:00.000Z",
      "duration_hours": 2.5,
      "break_hours": 0.5
    },
    {
      "step": 2,
      "step_name": "En route",
      "started_at": "2025-10-11T08:30:00.000Z",
      "completed_at": null,
      "duration_hours": 440.0,
      "break_hours": 11.5
    }
  ]
}
```

**Response :**
```json
{
  "success": true,
  "message": "Timer synchronized successfully",
  "data": {
    "job_id": 1,
    "current_step": 2,
    "timer_billable_hours": 430.5,
    "timer_is_running": false,
    "updated_at": "2025-11-03T14:30:00.000Z"
  }
}
```

**Controller Laravel :**
```php
// app/Http/Controllers/Api/V1/JobTimerController.php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Job;
use App\Models\JobStepHistory;
use App\Models\JobTimerEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JobTimerController extends Controller
{
    /**
     * Synchronize timer state from mobile app
     */
    public function syncTimer(Request $request, $id)
    {
        $validated = $request->validate([
            'current_step' => 'required|integer|min:0|max:6',
            'total_elapsed_hours' => 'required|numeric|min:0',
            'total_break_hours' => 'nullable|numeric|min:0',
            'billable_hours' => 'required|numeric|min:0',
            'is_running' => 'required|boolean',
            'step_history' => 'nullable|array',
            'step_history.*.step' => 'required|integer',
            'step_history.*.step_name' => 'nullable|string',
            'step_history.*.started_at' => 'required|date',
            'step_history.*.completed_at' => 'nullable|date',
            'step_history.*.duration_hours' => 'required|numeric|min:0',
            'step_history.*.break_hours' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            // Update job timer fields
            $job = Job::findOrFail($id);
            $job->update([
                'current_step' => $validated['current_step'],
                'timer_total_hours' => $validated['total_elapsed_hours'],
                'timer_billable_hours' => $validated['billable_hours'],
                'timer_break_hours' => $validated['total_break_hours'] ?? 0,
                'timer_is_running' => $validated['is_running'],
                'timer_last_updated' => now(),
            ]);

            // Update step history
            if (isset($validated['step_history']) && count($validated['step_history']) > 0) {
                // Delete existing history for this job
                JobStepHistory::where('job_id', $id)->delete();

                // Insert new history
                foreach ($validated['step_history'] as $stepData) {
                    JobStepHistory::create([
                        'job_id' => $id,
                        'step' => $stepData['step'],
                        'step_name' => $stepData['step_name'] ?? null,
                        'started_at' => $stepData['started_at'],
                        'completed_at' => $stepData['completed_at'] ?? null,
                        'duration_hours' => $stepData['duration_hours'],
                        'break_hours' => $stepData['break_hours'] ?? 0,
                    ]);
                }
            }

            // Log event (optional)
            JobTimerEvent::create([
                'job_id' => $id,
                'event_type' => 'sync',
                'current_step' => $validated['current_step'],
                'elapsed_ms' => $validated['total_elapsed_hours'] * 3600000,
                'break_ms' => ($validated['total_break_hours'] ?? 0) * 3600000,
                'event_data' => json_encode($validated),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Timer synchronized successfully',
                'data' => [
                    'job_id' => $job->id,
                    'current_step' => $job->current_step,
                    'timer_billable_hours' => $job->timer_billable_hours,
                    'timer_is_running' => $job->timer_is_running,
                    'updated_at' => $job->updated_at,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to synchronize timer',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
```

---

### 2. Démarrer le timer

**Endpoint :** `POST /api/v1/jobs/{id}/timer/start`

**Request Body :**
```json
{
  "started_at": "2025-11-03T10:00:00.000Z",
  "current_step": 1
}
```

**Response :**
```json
{
  "success": true,
  "message": "Timer started",
  "data": {
    "job_id": 1,
    "timer_is_running": true,
    "timer_started_at": "2025-11-03T10:00:00.000Z"
  }
}
```

**Controller :**
```php
public function startTimer(Request $request, $id)
{
    $validated = $request->validate([
        'started_at' => 'required|date',
        'current_step' => 'required|integer|min:1',
    ]);

    $job = Job::findOrFail($id);
    
    // Ne pas redémarrer si déjà en cours
    if ($job->timer_is_running) {
        return response()->json([
            'success' => false,
            'message' => 'Timer is already running',
        ], 400);
    }

    $job->update([
        'timer_is_running' => true,
        'timer_started_at' => $validated['started_at'],
        'current_step' => $validated['current_step'],
        'timer_last_updated' => now(),
    ]);

    // Log event
    JobTimerEvent::create([
        'job_id' => $id,
        'event_type' => 'start',
        'current_step' => $validated['current_step'],
        'event_data' => json_encode($validated),
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Timer started',
        'data' => [
            'job_id' => $job->id,
            'timer_is_running' => true,
            'timer_started_at' => $job->timer_started_at,
        ]
    ]);
}
```

---

### 3. Mettre en pause (Break)

**Endpoint :** `POST /api/v1/jobs/{id}/timer/pause`

**Request Body :**
```json
{
  "paused_at": "2025-11-03T14:00:00.000Z",
  "current_step": 2,
  "total_elapsed_hours": 442.5
}
```

**Controller :**
```php
public function pauseTimer(Request $request, $id)
{
    $validated = $request->validate([
        'paused_at' => 'required|date',
        'current_step' => 'required|integer',
        'total_elapsed_hours' => 'required|numeric|min:0',
    ]);

    $job = Job::findOrFail($id);

    $job->update([
        'timer_is_running' => false,
        'timer_total_hours' => $validated['total_elapsed_hours'],
        'timer_last_updated' => now(),
    ]);

    JobTimerEvent::create([
        'job_id' => $id,
        'event_type' => 'pause',
        'current_step' => $validated['current_step'],
        'elapsed_ms' => $validated['total_elapsed_hours'] * 3600000,
        'event_data' => json_encode($validated),
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Timer paused',
    ]);
}
```

---

### 4. Reprendre après pause

**Endpoint :** `POST /api/v1/jobs/{id}/timer/resume`

**Request Body :**
```json
{
  "resumed_at": "2025-11-03T15:00:00.000Z",
  "break_duration_hours": 1.0
}
```

**Controller :**
```php
public function resumeTimer(Request $request, $id)
{
    $validated = $request->validate([
        'resumed_at' => 'required|date',
        'break_duration_hours' => 'required|numeric|min:0',
    ]);

    $job = Job::findOrFail($id);

    $job->update([
        'timer_is_running' => true,
        'timer_break_hours' => $job->timer_break_hours + $validated['break_duration_hours'],
        'timer_last_updated' => now(),
    ]);

    JobTimerEvent::create([
        'job_id' => $id,
        'event_type' => 'resume',
        'break_ms' => $validated['break_duration_hours'] * 3600000,
        'event_data' => json_encode($validated),
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Timer resumed',
    ]);
}
```

---

### 5. Avancer le step (avec durée)

**Endpoint :** `PUT /api/v1/jobs/{id}/advance-step`

**Request Body :**
```json
{
  "from_step": 1,
  "to_step": 2,
  "step_duration_hours": 2.5,
  "completed_at": "2025-11-03T12:30:00.000Z"
}
```

**Controller :**
```php
public function advanceStep(Request $request, $id)
{
    $validated = $request->validate([
        'from_step' => 'required|integer',
        'to_step' => 'required|integer',
        'step_duration_hours' => 'required|numeric|min:0',
        'completed_at' => 'required|date',
    ]);

    $job = Job::findOrFail($id);

    // Update job current step
    $job->update([
        'current_step' => $validated['to_step'],
        'timer_last_updated' => now(),
    ]);

    // Update step history - mark previous step as completed
    JobStepHistory::where('job_id', $id)
        ->where('step', $validated['from_step'])
        ->update([
            'completed_at' => $validated['completed_at'],
            'duration_hours' => $validated['step_duration_hours'],
        ]);

    // Log event
    JobTimerEvent::create([
        'job_id' => $id,
        'event_type' => 'step_advance',
        'current_step' => $validated['to_step'],
        'event_data' => json_encode($validated),
    ]);

    return response()->json([
        'success' => true,
        'message' => "Step advanced from {$validated['from_step']} to {$validated['to_step']}",
        'data' => [
            'current_step' => $job->current_step,
        ]
    ]);
}
```

---

### 6. Compléter le job

**Endpoint :** `POST /api/v1/jobs/{id}/complete`

**Request Body :**
```json
{
  "completed_at": "2025-11-03T18:00:00.000Z",
  "total_billable_hours": 442.5,
  "total_break_hours": 12.0,
  "final_cost": 8850.00
}
```

**Controller :**
```php
public function completeJob(Request $request, $id)
{
    $validated = $request->validate([
        'completed_at' => 'required|date',
        'total_billable_hours' => 'required|numeric|min:0',
        'total_break_hours' => 'nullable|numeric|min:0',
        'final_cost' => 'required|numeric|min:0',
    ]);

    $job = Job::findOrFail($id);

    $job->update([
        'status' => 'completed',
        'current_step' => 5, // ou 6, selon votre workflow
        'timer_is_running' => false,
        'timer_billable_hours' => $validated['total_billable_hours'],
        'timer_break_hours' => $validated['total_break_hours'] ?? 0,
        'amount_total' => $validated['final_cost'],
        'timer_last_updated' => now(),
    ]);

    // Mark last step as completed
    JobStepHistory::where('job_id', $id)
        ->whereNull('completed_at')
        ->update(['completed_at' => $validated['completed_at']]);

    JobTimerEvent::create([
        'job_id' => $id,
        'event_type' => 'stop',
        'current_step' => $job->current_step,
        'elapsed_ms' => $validated['total_billable_hours'] * 3600000,
        'event_data' => json_encode($validated),
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Job completed successfully',
        'data' => [
            'job_id' => $job->id,
            'status' => 'completed',
            'final_cost' => $job->amount_total,
            'billable_hours' => $job->timer_billable_hours,
        ]
    ]);
}
```

---

## 📤 Modifier l'endpoint existant `/jobs/{id}/full`

Ajouter les nouvelles données de timer dans la réponse.

**Modifier le Controller :**
```php
public function getJobDetails($id)
{
    // ... code existant ...

    // ✅ AJOUTER: Récupérer l'historique des steps
    $stepHistory = JobStepHistory::where('job_id', $id)
        ->orderBy('step', 'asc')
        ->get()
        ->map(function ($history) {
            return [
                'step' => $history->step,
                'step_name' => $history->step_name,
                'started_at' => $history->started_at,
                'completed_at' => $history->completed_at,
                'duration_hours' => (float) $history->duration_hours,
                'break_hours' => (float) $history->break_hours,
                'is_current' => $history->completed_at === null,
            ];
        });

    // ✅ MODIFIER: Enrichir timeline avec données du timer
    $response['data']['timeline'] = [
        'created_at' => $job->created_at,
        'last_updated' => $job->updated_at,
        'total_duration_hours' => now()->diffInHours($job->created_at),
        'time_in_current_step_hours' => now()->diffInHours($job->updated_at),
        
        // ✅ NOUVEAU: Données du timer
        'timer_total_hours' => (float) $job->timer_total_hours,
        'timer_billable_hours' => (float) $job->timer_billable_hours,
        'timer_break_hours' => (float) $job->timer_break_hours,
        'timer_is_running' => (bool) $job->timer_is_running,
        'timer_started_at' => $job->timer_started_at,
        'timer_last_updated' => $job->timer_last_updated,
        
        // ✅ NOUVEAU: Historique des steps
        'step_history' => $stepHistory,
        
        // Existant
        'sla_status' => $slaStatus,
        'estimated_completion' => $job->end_window_end,
    ];

    return response()->json($response);
}
```

---

## 🔐 Routes à Ajouter

**Fichier :** `routes/api.php`

```php
use App\Http\Controllers\Api\V1\JobTimerController;

Route::prefix('v1')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        
        // Timer synchronization endpoints
        Route::put('/jobs/{id}/timer', [JobTimerController::class, 'syncTimer']);
        Route::post('/jobs/{id}/timer/start', [JobTimerController::class, 'startTimer']);
        Route::post('/jobs/{id}/timer/pause', [JobTimerController::class, 'pauseTimer']);
        Route::post('/jobs/{id}/timer/resume', [JobTimerController::class, 'resumeTimer']);
        Route::put('/jobs/{id}/advance-step', [JobTimerController::class, 'advanceStep']);
        Route::post('/jobs/{id}/complete', [JobTimerController::class, 'completeJob']);
        
        // Existing routes...
    });
});
```

---

## 📋 Models à Créer/Modifier

### 1. Modifier `Job.php` Model

```php
// app/Models/Job.php

class Job extends Model
{
    protected $fillable = [
        // ... existing fields ...
        'timer_total_hours',
        'timer_billable_hours',
        'timer_break_hours',
        'timer_is_running',
        'timer_started_at',
        'timer_last_updated',
    ];

    protected $casts = [
        // ... existing casts ...
        'timer_is_running' => 'boolean',
        'timer_started_at' => 'datetime',
        'timer_last_updated' => 'datetime',
    ];

    public function stepHistory()
    {
        return $this->hasMany(JobStepHistory::class);
    }

    public function timerEvents()
    {
        return $this->hasMany(JobTimerEvent::class);
    }
}
```

---

### 2. Créer `JobStepHistory.php` Model

```php
// app/Models/JobStepHistory.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobStepHistory extends Model
{
    protected $table = 'job_step_history';

    protected $fillable = [
        'job_id',
        'step',
        'step_name',
        'started_at',
        'completed_at',
        'duration_hours',
        'break_hours',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function job()
    {
        return $this->belongsTo(Job::class);
    }

    public function isCompleted()
    {
        return $this->completed_at !== null;
    }

    public function isCurrent()
    {
        return $this->completed_at === null;
    }
}
```

---

### 3. Créer `JobTimerEvent.php` Model (optionnel)

```php
// app/Models/JobTimerEvent.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobTimerEvent extends Model
{
    protected $table = 'job_timer_events';
    
    public $timestamps = false; // Only created_at

    protected $fillable = [
        'job_id',
        'event_type',
        'current_step',
        'elapsed_ms',
        'break_ms',
        'event_data',
    ];

    protected $casts = [
        'event_data' => 'array',
        'created_at' => 'datetime',
    ];

    public function job()
    {
        return $this->belongsTo(Job::class);
    }
}
```

---

## ✅ Checklist d'Implémentation Backend

### Phase 1 : Base de Données
- [ ] Créer migration pour colonnes timer dans `jobs`
- [ ] Créer migration pour table `job_step_history`
- [ ] Créer migration pour table `job_timer_events` (optionnel)
- [ ] Exécuter les migrations sur dev : `php artisan migrate`

### Phase 2 : Models
- [ ] Modifier `Job.php` (ajouter fillable, casts, relations)
- [ ] Créer `JobStepHistory.php`
- [ ] Créer `JobTimerEvent.php` (optionnel)

### Phase 3 : Controllers
- [ ] Créer `JobTimerController.php`
- [ ] Implémenter `syncTimer()`
- [ ] Implémenter `startTimer()`
- [ ] Implémenter `pauseTimer()`
- [ ] Implémenter `resumeTimer()`
- [ ] Implémenter `advanceStep()`
- [ ] Implémenter `completeJob()`

### Phase 4 : Routes
- [ ] Ajouter routes dans `routes/api.php`
- [ ] Tester routes avec Postman/Insomnia

### Phase 5 : Endpoint Existant
- [ ] Modifier `getJobDetails()` pour inclure timer data
- [ ] Modifier `getJobDetails()` pour inclure step_history
- [ ] Tester réponse `/jobs/{id}/full`

### Phase 6 : Tests & Validation
- [ ] Tester `PUT /jobs/{id}/timer` avec données simulées
- [ ] Tester `POST /jobs/{id}/timer/start`
- [ ] Tester `POST /jobs/{id}/timer/pause`
- [ ] Tester `PUT /jobs/{id}/advance-step`
- [ ] Vérifier données dans database
- [ ] Vérifier réponse complète `/jobs/{id}/full`

---

## 🧪 Exemple de Test avec Postman

### Test 1 : Synchroniser Timer

**Request :**
```
PUT http://your-api.com/api/v1/jobs/1/timer
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "current_step": 2,
  "total_elapsed_hours": 442.5,
  "total_break_hours": 12.0,
  "billable_hours": 430.5,
  "is_running": false,
  "step_history": [
    {
      "step": 1,
      "step_name": "Préparation",
      "started_at": "2025-10-11T06:02:13.000Z",
      "completed_at": "2025-10-11T08:30:00.000Z",
      "duration_hours": 2.5,
      "break_hours": 0.5
    },
    {
      "step": 2,
      "step_name": "En route",
      "started_at": "2025-10-11T08:30:00.000Z",
      "completed_at": null,
      "duration_hours": 440.0,
      "break_hours": 11.5
    }
  ]
}
```

**Expected Response :**
```json
{
  "success": true,
  "message": "Timer synchronized successfully",
  "data": {
    "job_id": 1,
    "current_step": 2,
    "timer_billable_hours": 430.5,
    "timer_is_running": false,
    "updated_at": "2025-11-03T14:30:00.000Z"
  }
}
```

---

### Test 2 : Vérifier les Données

**Request :**
```
GET http://your-api.com/api/v1/jobs/1/full
Authorization: Bearer YOUR_TOKEN
```

**Expected Response (extrait) :**
```json
{
  "success": true,
  "data": {
    "job": {
      "current_step": 2,
      "timer_billable_hours": 430.5,
      "timer_is_running": false
    },
    "timeline": {
      "timer_total_hours": 442.5,
      "timer_billable_hours": 430.5,
      "timer_break_hours": 12.0,
      "timer_is_running": false,
      "step_history": [
        {
          "step": 1,
          "step_name": "Préparation",
          "started_at": "2025-10-11T06:02:13.000Z",
          "completed_at": "2025-10-11T08:30:00.000Z",
          "duration_hours": 2.5,
          "is_current": false
        },
        {
          "step": 2,
          "step_name": "En route",
          "started_at": "2025-10-11T08:30:00.000Z",
          "completed_at": null,
          "duration_hours": 440.0,
          "is_current": true
        }
      ]
    }
  }
}
```

---

## 📊 Résumé

### Ce qui doit être modifié côté API :

**Base de données :**
- ✅ 3 migrations (colonnes jobs + 2 nouvelles tables)

**Models :**
- ✅ 1 model modifié (Job)
- ✅ 2 nouveaux models (JobStepHistory, JobTimerEvent)

**Controllers :**
- ✅ 1 nouveau controller (JobTimerController) avec 6 méthodes
- ✅ 1 controller existant modifié (JobController::getJobDetails)

**Routes :**
- ✅ 6 nouvelles routes

**Effort estimé :**
- Développement : 4-6 heures
- Tests : 2-3 heures
- **Total : 6-9 heures de dev backend**

---

## 🎯 Prochaine Étape

Une fois le backend implémenté, je pourrai créer le service de synchronisation côté app mobile qui appellera ces endpoints.

**Veux-tu que je :**
1. Crée un exemple de seed/factory pour tester les données ?
2. Génère un fichier Postman Collection pour tester tous les endpoints ?
3. Documente la stratégie de sync offline-first côté app ?

Dis-moi quand le backend sera prêt et on passera à l'implémentation mobile ! 🚀
