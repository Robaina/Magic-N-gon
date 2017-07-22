function(n=6,nodesum=NULL,nodeIdx=NULL,nodeLabel=NULL,solver="lpSolve"){
  
  #This function solves the Magic n-gon problem with an Integer Linear Program
  #The nodes of the graph are numbered following and inward spiral rotating to the right. 
  #From any vertex node in the exterior, so an original vertex of the polygon, to the central node
  #Requires either lpSolve or gurobi packages
  #
  #Arguments
  #
  #n: number of sides of the polygon (hexagon by default)
  #nodesum: the required value for the sum of three nodes in a line. Default is the
  #minimum value, i.e. total number of vertices plus 3, 19 + 3 in the magic hexagon.
  #Of course, this constraint is not guaranteed to be feasible!
  #nodeIdx and nodeLabel: An optional, extra constraint which allows to fix a value to a 
  #given node. For instance, we can set node number 1 to have the value 12. Then nodeIdx=1
  #and nodeLabel=12. Of course this constraint is not guaranteed to be feasible!
  #solver: the solver used to solve the Interger Linear Program, either "lpSolve" or "gurobi".
  #Gurobi is much faster but requires an academic license (www.gurobi.com)
  #
  #***********Semidan Robaina Estevez, July 2017**************
  
  Vnum = 3*n + 1
  if(is.null(nodesum)){nodesum = Vnum + 3}
  
  #Define topological matrix 
  O = matrix(0,2*n,3)
  Sidx = seq(1,2*n-3,2)
  for (i in seq(1,n-1)){
    O[i,] = seq(Sidx[i],Sidx[i]+2)
    O[n+i,] = c(Sidx[i],2*n+i,Vnum)
  }
  O[n,] = c(2*n-1,2*n,1)
  O[2*n,] = c(2*n-1,Vnum-1,Vnum)
  
  w = seq(1,Vnum)
  A1 = A2 = matrix(0,Vnum,Vnum^2)
  A3 = matrix(0,2*n,Vnum^2)
  idx1 = 0
  idx2 = 1
  
  #Define constraints matrix A
  for (i in seq(1,Vnum)){
    
    A1[i,(idx1+1):(idx1+Vnum)] = rep(1,Vnum)
    idx1 = idx1+Vnum
    
    A2[i,seq(idx2,Vnum^2,Vnum)] = 1
    idx2 = idx2+1
  }
  for (i in seq(1,2*n)){
    
    A3[i,c(((O[i,1]-1)*Vnum+1):(((O[i,1]-1)*Vnum+1)+Vnum-1))] = w
    A3[i,c(((O[i,2]-1)*Vnum+1):(((O[i,2]-1)*Vnum+1)+Vnum-1))] = w
    A3[i,c(((O[i,3]-1)*Vnum+1):(((O[i,3]-1)*Vnum+1)+Vnum-1))] = w
    
  }
  Amat = rbind(A1,A2,A3)
  vecsense = rep("=",2*Vnum+2*n)
  bvec = c(rep(1,2*Vnum),rep(nodesum,2*n))
  
  if(!is.null(nodeIdx) & !is.null(nodeLabel)){
    #Impose extra-constraints
    A4 = c(rep(0,Vnum^2))
    A4[(nodeIdx-1)*Vnum+nodeLabel] = 1
    Amat = rbind(Amat,A4)
    bvec = c(rep(1,2*Vnum),rep(nodesum,2*n),1)
    vecsense = rep("=",2*Vnum+2*n+1)
  }
  
  
  #Solve MILP with gurobi
  if(solver=="gurobi"){
    library("gurobi")
    m = p = list()
    m$A = Amat
    m$sense = vecsense
    m$rhs = bvec
    m$lb = rep(0,Vnum^2)
    m$ub = rep(1,Vnum^2)
    m$obj = c(rep(1,Vnum),rep(0,(Vnum-1)*Vnum))
    m$vtypes = rep("B",Vnum^2)
    m$modelsense = "min"
    p$OutputFlag = 0
    sol = gurobi(m,p)
    x = sol$x
  }
  
  #Solve MILP with lpSolve
  if(solver=="lpSolve"){
    library("lpSolve")
    #num.bi.solns = k finds k alternative solutions!
    #use.rw = TRUE required for the latter
    
    sol = lp(objective.in = c(rep(1,Vnum),rep(0,(Vnum-1)*Vnum)), const.mat = Amat, 
             const.dir = vecsense, const.rhs = bvec, all.int = TRUE, scale =196)
    x = sol$solution
    #sol$status
    #sol$num.bin.solns
  }
  
  #Retrieve solution
  N = cbind(w,rep(0,Vnum))
  idx1 = 0
  for(i in seq(1,Vnum)){
    N[i,2] = w%*%x[(idx1+1):(idx1+Vnum)]
    idx1 = idx1+Vnum
  }
  colnames(N) = c("vertex","label")
  return(N)
}