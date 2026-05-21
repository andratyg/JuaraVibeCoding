export function exportTasksToICS(tasks: any[]) {
    if (!tasks || tasks.length === 0) return;

    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//FlowState//Task Manager//EN
`;

    // Function to format date to iCal standard (YYYYMMDDTHHMMSSZ)
    const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    tasks.forEach(task => {
        const now = new Date();
        const createdDate = task.createdAt?.toDate ? task.createdAt.toDate() : now;
        
        let start = now;
        let end = new Date(now.getTime() + (task.duration || 30) * 60000);

        if (task.startTime?.toDate) {
            start = task.startTime.toDate();
            if (task.endTime?.toDate) {
                end = task.endTime.toDate();
            } else {
                end = new Date(start.getTime() + (task.duration || 30) * 60000);
            }
        }

        icsContent += `BEGIN:VEVENT
UID:${task.id || Math.random().toString(36).substring(7)}@flowstate.app
DTSTAMP:${formatDate(now)}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:${task.title || 'Task'}
DESCRIPTION:Priority: ${task.priority || 'Medium'}%0AStatus: ${task.status || 'Pending'}
STATUS:CONFIRMED
END:VEVENT
`;
    });

    icsContent += `END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'flowstate-tasks.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
