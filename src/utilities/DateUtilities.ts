export class DateUtilities {
  public static parseDurationStringToSeconds(str: string): number {
    let seconds = 0;
    const days = str.match(/(\d+)\s*d/);
    const hours = str.match(/(\d+)\s*h/);
    const minutes = str.match(/(\d+)\s*m/);
    if (days) seconds += parseInt(days[1])*86400;
    if (hours) seconds += parseInt(hours[1])*3600;
    if (minutes) seconds += parseInt(minutes[1])*60;
    return seconds;
  }
}
