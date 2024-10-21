const NBU_API_URL = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json';

let dealRate = 0;
let currentDealId = null;

function getNBURate() {
   return fetch(NBU_API_URL)
      .then(response => response.json())
      .then(data => data[0].rate);
}

function getDealRate(dealId) {
   return ZOHO.CRM.API.getRecord({ Entity: "Deals", RecordID: dealId })
      .then(data => {
         dealRate = data.data[0].Currency_Rate;
         document.getElementById("dealRate").innerText = dealRate;
         return dealRate;
      });
}

function calculateDifference(nbuRate) {
   const difference = ((nbuRate - dealRate) / dealRate) * 100;
   const roundedDifference = Math.round(difference * 10) / 10;
   document.getElementById("difference").innerText = roundedDifference;

   if (roundedDifference >= 5) {
      document.getElementById("saveButton").style.display = 'block';
   } else {
      document.getElementById("saveButton").style.display = 'none';
   }
}

function saveRate() {
   if (!currentDealId) {
      Swal.fire({
         title: 'Помилка!',
         text: 'ID угоди не встановлено.',
         icon: 'error',
         confirmButtonText: 'ОК'
      });
      return;
   }

   getNBURate().then(nbuRate => {
      nbuRate = parseFloat(nbuRate);
      if (isNaN(nbuRate)) {
         Swal.fire({
            title: 'Помилка!',
            text: 'Курс НБУ не є допустимим числом.',
            icon: 'error',
            confirmButtonText: 'ОК'
         });
         return;
      }

      const updateData = {
         id: currentDealId,
         Currency_Rate: nbuRate
      };

      ZOHO.CRM.API.updateRecord({
         Entity: "Deals",
         RecordID: currentDealId,
         APIData: updateData
      }).then(response => {
         getDealRate(currentDealId).then(() => {
            calculateDifference(nbuRate);
            Swal.fire({
               title: 'Успіх!',
               text: 'Курс угоди успішно оновлено.',
               icon: 'success',
               confirmButtonText: 'ОК'
            });
         });
      }).catch(error => {
         Swal.fire({
            title: 'Помилка!',
            text: 'Не вдалося оновити курс угоди.',
            icon: 'error',
            confirmButtonText: 'ОК'
         });
      });
   }).catch(error => {
      Swal.fire({
         title: 'Помилка!',
         text: 'Не вдалося отримати курс НБУ.',
         icon: 'error',
         confirmButtonText: 'ОК'
      });
   });
}

// Ініціалізація віджета
ZOHO.embeddedApp.on("PageLoad", function (data) {
   var dealId = data.EntityId;
   currentDealId = dealId;
   if (dealId) {
      getNBURate().then(nbuRate => {
         document.getElementById("nbuRate").innerText = nbuRate;
         document.getElementById("lastUpdate").innerText = new Date().toLocaleString('uk-UA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
         }).replace(',', ' о');
         return getDealRate(dealId).then(dealRate => {
            calculateDifference(nbuRate);
         });
      });
   } else {
      Swal.fire({
         title: 'Помилка!',
         text: 'ID угоди не знайдено.',
         icon: 'error',
         confirmButtonText: 'ОК'
      });
   }
});

ZOHO.embeddedApp.init();