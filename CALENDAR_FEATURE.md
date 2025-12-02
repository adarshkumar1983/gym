# Calendar Feature Documentation

## Overview

The Calendar feature provides a comprehensive workout scheduling system for the gym app, allowing users to schedule workouts, view their calendar, manage recurring workouts, and track workout completion.

## Features Implemented

### 1. **Monthly Calendar View**
- Interactive calendar component showing workouts
- Visual indicators for days with scheduled workouts
- Color-coded status indicators (pending, in-progress, completed, skipped)
- Month navigation (previous/next)
- Today highlighting
- Selected date highlighting

### 2. **Workout Scheduling**
- Schedule single workouts
- Schedule recurring workouts (daily, weekly, monthly)
- Select workout templates
- Set date and time
- Automatic generation of recurring workout instances

### 3. **Workout Management**
- View workouts for selected date
- Update workout status (pending → in-progress → completed/skipped)
- Reschedule workouts
- Delete scheduled workouts
- Workout completion tracking

### 4. **Calendar API**
- Get calendar events for date range
- Get workouts for specific date
- Schedule workouts
- Update workout status
- Reschedule workouts
- Delete workouts
- Get upcoming workouts
- Get workout statistics

## Backend Implementation

### Models Used
- **AssignedWorkout** - Stores scheduled workouts
- **RecurrenceRule** - Stores recurring workout rules
- **WorkoutTemplate** - Workout templates to schedule

### Services
- **CalendarService** (`server/src/services/calendar/calendar.service.ts`)
  - `getCalendarEvents()` - Get events for date range
  - `getWorkoutsForDate()` - Get workouts for specific date
  - `scheduleWorkout()` - Schedule a workout (with optional recurrence)
  - `generateRecurringWorkouts()` - Generate recurring workout instances
  - `updateWorkoutStatus()` - Update workout status
  - `rescheduleWorkout()` - Change workout date/time
  - `deleteWorkout()` - Delete scheduled workout
  - `getUpcomingWorkouts()` - Get upcoming workouts
  - `getWorkoutStats()` - Get workout statistics

### API Endpoints

#### `GET /api/calendar/events`
Get calendar events for a date range.

**Query Parameters:**
- `startDate` (required) - Start date (ISO string)
- `endDate` (required) - End date (ISO string)

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "date": "2024-01-15",
        "workouts": [
          {
            "id": "...",
            "templateId": "...",
            "templateName": "Full Body Workout",
            "scheduledAt": "2024-01-15T10:00:00.000Z",
            "status": "pending",
            "exercisesCount": 8
          }
        ]
      }
    ]
  }
}
```

#### `GET /api/calendar/workouts`
Get workouts for a specific date.

**Query Parameters:**
- `date` (required) - Date (ISO string)

#### `POST /api/calendar/schedule`
Schedule a workout.

**Request Body:**
```json
{
  "templateId": "workout_template_id",
  "scheduledAt": "2024-01-15T10:00:00.000Z",
  "recurrence": {
    "type": "weekly",
    "interval": 1,
    "endDate": "2024-12-31T00:00:00.000Z",
    "daysOfWeek": [1, 3, 5] // Monday, Wednesday, Friday
  }
}
```

#### `PUT /api/calendar/workouts/:id/status`
Update workout status.

**Request Body:**
```json
{
  "status": "completed" // or "pending", "in_progress", "skipped"
}
```

#### `PUT /api/calendar/workouts/:id/reschedule`
Reschedule a workout.

**Request Body:**
```json
{
  "scheduledAt": "2024-01-16T10:00:00.000Z"
}
```

#### `DELETE /api/calendar/workouts/:id`
Delete a scheduled workout.

#### `GET /api/calendar/upcoming`
Get upcoming workouts.

**Query Parameters:**
- `limit` (optional) - Number of workouts to return (default: 5)

#### `GET /api/calendar/stats`
Get workout statistics.

**Query Parameters:**
- `startDate` (optional) - Start date
- `endDate` (optional) - End date

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 30,
      "completed": 25,
      "pending": 3,
      "skipped": 2,
      "completionRate": 83.33
    }
  }
}
```

## Mobile Implementation

### Components

#### `Calendar.tsx`
Reusable calendar component with:
- Monthly grid view
- Workout indicators on dates
- Date selection
- Month navigation
- Today highlighting

#### `CalendarScreen` (`mobile/app/(tabs)/calendar.tsx`)
Main calendar screen with:
- Calendar view
- Workout list for selected date
- Schedule workout modal
- Workout status management
- Delete workout functionality

### API Client

#### `calendar-api.ts`
TypeScript client for calendar API with methods:
- `getCalendarEvents()`
- `getWorkoutsForDate()`
- `scheduleWorkout()`
- `updateWorkoutStatus()`
- `rescheduleWorkout()`
- `deleteWorkout()`
- `getUpcomingWorkouts()`
- `getWorkoutStats()`

## Usage Examples

### Schedule a Single Workout
```typescript
await calendarAPI.scheduleWorkout({
  templateId: 'workout_template_id',
  scheduledAt: new Date('2024-01-15T10:00:00').toISOString(),
});
```

### Schedule a Recurring Workout
```typescript
await calendarAPI.scheduleWorkout({
  templateId: 'workout_template_id',
  scheduledAt: new Date('2024-01-15T10:00:00').toISOString(),
  recurrence: {
    type: 'weekly',
    interval: 1,
    daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
    endDate: new Date('2024-12-31').toISOString(),
  },
});
```

### Get Calendar Events
```typescript
const response = await calendarAPI.getCalendarEvents(
  '2024-01-01',
  '2024-01-31'
);
```

### Update Workout Status
```typescript
await calendarAPI.updateWorkoutStatus(workoutId, 'completed');
```

## Recurring Workouts

The system supports three types of recurring workouts:

1. **Daily** - Every N days
2. **Weekly** - Every N weeks, optionally on specific days
3. **Monthly** - Every N months

When a recurring workout is scheduled:
- A `RecurrenceRule` is created
- Up to 12 future workout instances are automatically generated
- Workouts are generated up to 90 days in advance
- Past dates are skipped

## Workout Statuses

- **pending** - Scheduled but not started
- **in_progress** - Currently being performed
- **completed** - Finished successfully
- **skipped** - Not performed

## UI Features

### Calendar View
- Color-coded workout indicators
- Today highlighting
- Selected date highlighting
- Month navigation
- Workout count indicators

### Workout List
- Shows all workouts for selected date
- Status indicators
- Quick actions (complete, skip, delete)
- Time display
- Workout name and details

### Schedule Modal
- Workout template selection
- Date and time display
- Schedule button
- Loading states

## Navigation

The calendar is accessible via:
- Tab navigation (Calendar tab)
- Home screen quick action button
- Direct route: `/(tabs)/calendar`

## Future Enhancements

Potential improvements:
1. **Time picker** - Better time selection UI
2. **Recurring workout editor** - Edit recurring rules
3. **Workout reminders** - Push notifications
4. **Calendar sync** - Sync with device calendar
5. **Weekly/Daily views** - Additional view options
6. **Drag and drop** - Reschedule by dragging
7. **Bulk operations** - Select multiple workouts
8. **Workout templates** - Create templates from scheduled workouts
9. **Statistics dashboard** - Visual stats and charts
10. **Export** - Export calendar to CSV/PDF

## Notes

- Workouts are linked to workout templates
- Recurring workouts generate instances automatically
- Past workouts can be marked as completed or skipped
- Workout status affects progress tracking
- Calendar data is cached for performance
- All operations require authentication

