function lettersOnly(e) {
  key = e.keyCode || e.which;
  tecla = String.fromCharCode(key).toLowerCase();
  letters = " áéíóúabcdefghijklmnñopqrstuvwxyz-";
  especials = "8-37-39-46";

  tecla_especial = false
  for (var i in especials) {
    if (key == especials[i]) {
      tecla_especial = true;
      break;
    }
  }

  if (letters.indexOf(tecla) == -1 && !tecla_especial) {
    return false;
  }
}

function numbersOnly(e) {
  key = e.keyCode || e.which;
  tecla = String.fromCharCode(key).toLowerCase();
  letters = "1234567890";
  especials = "8-37-39-46";

  tecla_especial = false
  for (var i in especials) {
    if (key == especials[i]) {
      tecla_especial = true;
      break;
    }
  }

  if (letters.indexOf(tecla) == -1 && !tecla_especial) {
    return false;
  }
}

function hexOnly(e) {
  key = e.keyCode || e.which;
  tecla = String.fromCharCode(key).toLowerCase();
  letters = "abcdefx1234567890";
  especials = "8-37-39-46";

  tecla_especial = false
  for (var i in especials) {
    if (key == especials[i]) {
      tecla_especial = true;
      break;
    }
  }

  if (letters.indexOf(tecla) == -1 && !tecla_especial) {
    return false;
  }
}

function clean() {
  document.getElementById("imgSelected").value = "";
  cleanValidations();
}

function cleanValidation() {
  var cleanV = document.getElementsByClassName('was-validated');
  Array.prototype.filter.call(cleanV, function (cleaning) {
    cleaning.classList.remove('was-validated');
  })
}

function cleanValidations() {
  var times = document.getElementsByClassName('was-validated').length;
  for (var i = 0; i < times; i++) cleanValidation();
}

function validate(classToValidate, event) {
  cleanValidations();
  var forms = document.getElementsByClassName(classToValidate);
  Array.prototype.filter.call(forms, function (form) {
    var inputForms = form.getElementsByTagName('select');
    Array.prototype.filter.call(inputForms, function (inputs) {
      if (inputs.checkValidity() === false) {
        event.preventDefault();
      }
      form.classList.add('was-validated');
    })
  })
  Array.prototype.filter.call(forms, function (form) {
    var inputForms = form.getElementsByTagName('input');
    Array.prototype.filter.call(inputForms, function (inputs) {
      if (inputs.checkValidity() === false) {
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    })
  })
}

function validateBigAmount() {
  var field = $('#amount').val();
  var isEven = bigInt(field).isEven();
  if (isEven == true) {
    document.getElementById('amount').setCustomValidity('');
  } else {
    document.getElementById('amount').setCustomValidity('Must be even', (event) => {
      event.preventDefault();
    });
  }
}


function showAlert(field, mensaje) {
  $(field).append(`<div id="alertWarning" style="overflow-wrap: break-word;" class="scene_element fadeInDown col-12 text-center"><div class="alert alert-danger alert-dismissible fade show" role="alert">
    <strong>${mensaje}
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
  </div>`);
  $("#alertWarning").delay(5000).fadeOut(0, function () {
    //$(this).removeClass('fadeInDown');
    $(this).addClass('fadeOutUp');
    document.getElementById("alertWarning").setAttribute("style", "display:true");
    //$(this).remove();  
    $("#alertWarning").delay(300).fadeOut(0, function () {
      $(this).remove();
    });
  });
}

function cubeSpinner(field) {
  $(field).append(`
        <div class="text-center spinnerCube">
            <div class="boxes">
                <div class="box">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <div class="box">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <div class="box">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
                <div class="box">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </div>
        </div>
      `);
}

(function () {
  'use strict';
  document.getElementById('splitAmount').addEventListener('click', function (event) {
    validate('splitClass', event)
  });
})();

//   (function() {
//     var accountInterval = setInterval(function() {
//         App.updateBalances();
//       }, 1000);
//   })();