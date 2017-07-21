# Magic-N-gon
Solving the Magic N-gon
This repository contains the R code of two functions desinged to solve and explore the "magic n-gon"
The Magic N-gon is a mathematical puzzle inspired by the challenge proposed by the Plus Magazine:
https://plus.maths.org/content/magic-19
It contains two programs, the first one, MagicPolygon, tries to find a solution to the problem
(details in the link provided). It allows to change the problem from an hexagon to any other polygon, 
as well as change the value of the sum of 3 adjacent nodes in the associated graph. Of course, feasible
solutions are not guaranteed. The programs solves an Integer Linear Program. Requires either the R package lpSolve,
a standalone free solver, or a working instalation of Gurobi (licensed) as well as the wrapper for R installed.
The second program, MagicPolygonAO, samples alternative solutions to the puzzle. Not all solutions are guaranteed
to be unique (although this could be fixed)
