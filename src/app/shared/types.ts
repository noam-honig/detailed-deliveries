import * as radweb from 'radweb';


export class DateTimeColumn extends radweb.DateTimeColumn {
  
  dontShowTimeForOlderDates = false;
  getStringForInputTime() {
    if (!this.value)
      return '';
    return this.padZero(this.value.getHours()) + ':' + this.padZero(this.value.getMinutes());
  }
  getStringForInputDate() {
    if (!this.value)
      return '';

    return this.rawValue.substring(0, 10);
    return this.padZero(this.value.getHours()) + ':' + this.padZero(this.value.getMinutes());
  }
  padZero(v: number) {
    var result = '';
    if (v < 10)
      result = '0';
    result += v;
    return result;
  }
  timeInputChangeEvent(e: any) {
    var hour = 0;
    var minutes = 0;
    var timeString: string = e.target.value;
    if (timeString.length >= 5) {
      hour = +timeString.substring(0, 2);
      minutes = +timeString.substring(3, 5);

    }

    this.value = new Date(this.value.getFullYear(), this.value.getMonth(), this.value.getDate(), hour, minutes);

  }
  dateInputChangeEvent(e: any) {
    var newDate: Date = e.target.valueAsDate;
    var hours = 0;
    var minutes = 0;
    if (this.value) {
      hours = this.value.getHours();
      minutes = this.value.getMinutes();

    }
    this.value = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), hours, minutes);

  }
  relativeDateName(d?: Date, now?: Date) {
    if (!d)
      d = this.value;
    if (!d)
      return '';
    if (!now)
      now = new Date();
    let sameDay = (x: Date, y: Date) => {
      return x.getFullYear() == y.getFullYear() && x.getMonth() == y.getMonth() && x.getDate() == y.getDate()
    }
    let diffInMinues = Math.ceil((now.valueOf() - d.valueOf()) / 60000);
    if (diffInMinues <= 1)
      return 'לפני דקה';
    if (diffInMinues < 60) {

      return 'לפני ' + diffInMinues + ' דקות';
    }
    if (diffInMinues < 60 * 10 || sameDay(d, now)) {
      let hours = Math.floor(diffInMinues / 60);
      let min = diffInMinues % 60;
      if (min > 50) {
        hours += 1;
        min = 0;
      }
      let r;
      switch (hours) {
        case 1:
          r = 'שעה';
          break
        case 2:
          r = "שעתיים";
          break;
        default:
          r = hours + ' שעות';
      }

      if (min > 35)
        r += ' ושלושת רבעי';
      else if (min > 22) {
        r += ' וחצי';
      }
      else if (min > 7) {
        r += ' ורבע ';
      }
      return 'לפני ' + r;

    }
    let r = ''
    if (sameDay(d, new Date(now.valueOf() - 86400 * 1000))) {
      r = 'אתמול';
    }
    else if (sameDay(d, new Date(now.valueOf() - 86400 * 1000 * 2))) {
      r = 'שלשום';
    }
    else {
      r = 'לפני ' + (Math.trunc(now.valueOf() / (86400 * 1000)) - Math.trunc(d.valueOf() / (86400 * 1000))) + ' ימים';
    }
    let t = d.getMinutes().toString();
    if (t.length == 1)
      t = '0' + t;
    if (this.dontShowTimeForOlderDates)
      return r;
    return r += ' ב' + d.getHours() + ':' + t;
  }
  get displayValue() {
    if (this.value)
      return this.value.toLocaleString("he-il");
    return '';
  }

}
export class changeDate extends DateTimeColumn {
  readonly = true;
}

