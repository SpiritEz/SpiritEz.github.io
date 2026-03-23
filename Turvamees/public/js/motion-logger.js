// ==========================================
// TEADUS-ANDMED MÄLUKS
// Salvestab liikumise logisid ja statistikat
// ==========================================

class MotionLogger {
  // ==========================================
  // KONSTRUKTOR
  // ==========================================
  
  constructor() {
    this.logs = [];
    this.statistics = {
      totalMotionEvents: 0,
      forwardCount: 0,
      backwardCount: 0,
      sideCount: 0,
      totalMotionPixels: 0,
      averageIntensity: 0
    };
    
    // Laadi olemasolevad andmed localStorage'st
    this.loadFromStorage();
  }
  
  // ==========================================
  // LIIKUMISE LOGIMISE FUNKTSIOON
  // ==========================================
  
  logMotion(direction, intensity) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      direction,
      intensity,
      uid: this.generateUID()
    };
    
    this.logs.push(logEntry);
    
    // Statistika uuendamine
    this.updateStatistics(direction, intensity);
    
    // Salvesta localStorage'i
    this.saveToStorage();
    
    console.log(`📝 Liikumise log: ${direction} (${intensity.toFixed(2)}%)`);
    
    return logEntry;
  }
  
  // ==========================================
  // STATISTIKA UUENDAMINE
  // ==========================================
  
  updateStatistics(direction, intensity) {
    this.statistics.totalMotionEvents++;
    this.statistics.totalMotionPixels += intensity;
    
    switch(direction) {
      case 'forward':
        this.statistics.forwardCount++;
        break;
      case 'backward':
        this.statistics.backwardCount++;
        break;
      case 'side':
        this.statistics.sideCount++;
        break;
    }
    
    // Arvuta keskmiste intensiivsus
    this.statistics.averageIntensity = 
      this.statistics.totalMotionPixels / this.statistics.totalMotionEvents;
  }
  
  // ==========================================
  // STORAGE FUNKTSIOONID
  // ==========================================
  
  saveToStorage() {
    try {
      localStorage.setItem('motion-logs', JSON.stringify(this.logs));
      localStorage.setItem('motion-stats', JSON.stringify(this.statistics));
    } catch (error) {
      console.error('Storage salvestamise viga:', error);
    }
  }
  
  loadFromStorage() {
    try {
      const logsData = localStorage.getItem('motion-logs');
      const statsData = localStorage.getItem('motion-stats');
      
      if (logsData) {
        this.logs = JSON.parse(logsData);
      }
      
      if (statsData) {
        this.statistics = JSON.parse(statsData);
      }
    } catch (error) {
      console.error('Storage laadimise viga:', error);
    }
  }
  
  // ==========================================
  // UID GENEREERIMINE
  // ==========================================
  
  generateUID() {
    return 'uid-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
  
  // ==========================================
  // ANDMETE TÜHJENDAMINE
  // ==========================================
  
  clearLogs() {
    this.logs = [];
    this.statistics = {
      totalMotionEvents: 0,
      forwardCount: 0,
      backwardCount: 0,
      sideCount: 0,
      totalMotionPixels: 0,
      averageIntensity: 0
    };
    
    localStorage.removeItem('motion-logs');
    localStorage.removeItem('motion-stats');
    
    console.log('✅ Logid ja statistika tühjendatud');
  }
  
  // ==========================================
  // ARUANDE GENEREERIMINE
  // ==========================================
  
  generateReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      totalLogs: this.logs.length,
      statistics: this.statistics,
      events: this.logs
    };
    
    return report;
  }
  
  // ==========================================
  // JSON EKSPORT
  // ==========================================
  
  exportToJSON() {
    const dataStr = JSON.stringify(this.generateReport(), null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `motion-log-${Date.now()}.json`;
    link.click();
    
    console.log('✅ Andmed eksporditud JSON-ina');
  }
  
  // ==========================================
  // CSV EKSPORT
  // ==========================================
  
  exportToCSV() {
    let csv = 'Aeg,Suund,Intensiivsus\n';
    
    this.logs.forEach(log => {
      csv += `${log.timestamp},${log.direction},${log.intensity.toFixed(2)}\n`;
    });
    
    const dataBlob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `motion-log-${Date.now()}.csv`;
    link.click();
    
    console.log('✅ Andmed eksporditud CSV-ina');
  }
  
  // ==========================================
  // STATISTIKA KUVAMINE
  // ==========================================
  
  displayStatistics() {
    console.log(`
    📊 LIIKUMISE STATISTIKA:
    ========================
    Kogulised liikumise sündmused: ${this.statistics.totalMotionEvents}
    Edasi: ${this.statistics.forwardCount}
    Tagasi: ${this.statistics.backwardCount}
    Küljele: ${this.statistics.sideCount}
    Keskmine intensiivsus: ${this.statistics.averageIntensity.toFixed(2)}%
    ========================
    `);
  }
}

// Ülemaailmne logger
const motionLogger = new MotionLogger();

console.log('✅ Motion Logger laaditud');
