/* Transform a linear program expressed in matrix form to the string required
   by GLPK.js. That is, the linear program is defined as:

                             min c*x
                             s.t.
                                 Ax <= b
                                 lb <= x <= ub

  in which A is the constraints matrix, b an array of right-hand-side terms, and lb and ub the arrays containing the lower and upper bounds for the
  variables, x.

  Semidan Roaina Estevez (semidanrobaina.com), 2019
  */
